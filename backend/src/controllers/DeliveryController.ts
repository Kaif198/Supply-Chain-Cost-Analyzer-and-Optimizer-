import { Request, Response } from 'express';
import { z } from 'zod';
import { CostCalculationService } from '../services/CostCalculationService';
import { DeliveryRepository } from '../repositories/DeliveryRepository';
import { PremiseRepository } from '../repositories/PremiseRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { InventoryChainService } from '../services/inventory-chain.service';

// Validation schemas
const calculateCostSchema = z.object({
  originId: z.string().uuid('Origin ID must be a valid UUID'),
  destinationId: z.string().uuid('Destination ID must be a valid UUID'),
  vehicleId: z.string().uuid('Vehicle ID must be a valid UUID'),
  demand: z.number().int().positive('Demand must be a positive integer'),
});

const createDeliverySchema = z.object({
  originId: z.string().uuid('Origin ID must be a valid UUID'),
  destinationId: z.string().uuid('Destination ID must be a valid UUID'),
  vehicleId: z.string().uuid('Vehicle ID must be a valid UUID'),
  demand: z.number().int().positive('Demand must be a positive integer'),
  deliveryDate: z.string().datetime('Delivery date must be a valid ISO datetime'),
});

const listDeliveriesSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  vehicleId: z.string().uuid().optional(),
  originId: z.string().uuid().optional(),
  destinationId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export class DeliveryController {
  private static costCalculationService = new CostCalculationService();
  private static deliveryRepository = new DeliveryRepository();
  private static premiseRepository = new PremiseRepository();
  private static vehicleRepository = new VehicleRepository();

  /**
   * @swagger
   * /api/deliveries/calculate:
   *   post:
   *     summary: Calculate delivery cost
   *     description: Calculate itemized cost breakdown for a single delivery from origin to destination
   *     tags: [Deliveries]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - originId
   *               - destinationId
   *               - vehicleId
   *               - demand
   *             properties:
   *               originId:
   *                 type: string
   *                 format: uuid
   *                 description: Origin premise ID
   *               destinationId:
   *                 type: string
   *                 format: uuid
   *                 description: Destination premise ID
   *               vehicleId:
   *                 type: string
   *                 format: uuid
   *                 description: Vehicle ID
   *               demand:
   *                 type: integer
   *                 minimum: 1
   *                 description: Number of cases to deliver
   *                 example: 500
   *     responses:
   *       200:
   *         description: Cost calculation successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CostBreakdown'
   *       400:
   *         description: Validation error or capacity constraint
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Origin, destination, or vehicle not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async calculate(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = calculateCostSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            timestamp: new Date().toISOString(),
            details: validation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }

      const { originId, destinationId, vehicleId, demand } = validation.data;

      // Fetch required data
      const [origin, destination, vehicle] = await Promise.all([
        DeliveryController.premiseRepository.findById(originId),
        DeliveryController.premiseRepository.findById(destinationId),
        DeliveryController.vehicleRepository.findById(vehicleId),
      ]);

      // Validate entities exist
      if (!origin) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Origin premise not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!destination) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Destination premise not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!vehicle) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Vehicle not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Calculate cost
      const costBreakdown = DeliveryController.costCalculationService.calculateDeliveryCost({
        origin: {
          latitude: origin.latitude,
          longitude: origin.longitude,
          elevation: origin.elevation,
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
          elevation: destination.elevation,
        },
        vehicle: {
          id: vehicle.id,
          name: vehicle.name,
          type: vehicle.type,
          capacity: vehicle.capacity,
          fuelConsumptionRate: vehicle.fuelConsumptionRate,
          co2EmissionRate: vehicle.co2EmissionRate,
          hourlyLaborCost: vehicle.hourlyLaborCost,
          fixedCostPerDelivery: vehicle.fixedCostPerDelivery,
        },
        demand,
      });

      res.json(costBreakdown);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Capacity constraint violation')) {
        res.status(400).json({
          error: {
            code: 'CAPACITY_CONSTRAINT',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        console.error('Error calculating delivery cost:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  }

  /**
   * @swagger
   * /api/deliveries:
   *   get:
   *     summary: List deliveries with pagination and filtering
   *     description: Retrieve a paginated list of deliveries with optional filters
   *     tags: [Deliveries]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter deliveries from this date (ISO 8601)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter deliveries until this date (ISO 8601)
   *       - in: query
   *         name: vehicleId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by vehicle ID
   *       - in: query
   *         name: originId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by origin premise ID
   *       - in: query
   *         name: destinationId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by destination premise ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 1000
   *           default: 100
   *         description: Maximum number of results to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *         description: Number of results to skip
   *     responses:
   *       200:
   *         description: List of deliveries retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 deliveries:
   *                   type: array
   *                   items:
   *                     type: object
   *                 total:
   *                   type: integer
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validation = listDeliveriesSchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            timestamp: new Date().toISOString(),
            details: validation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }

      const { startDate, endDate, vehicleId, originId, destinationId, limit, offset } = validation.data;

      // Build filter
      const filter: any = {};
      if (startDate) filter.startDate = new Date(startDate);
      if (endDate) filter.endDate = new Date(endDate);
      if (vehicleId) filter.vehicleId = vehicleId;
      if (originId) filter.originId = originId;
      if (destinationId) filter.destinationId = destinationId;

      // Get deliveries
      const result = await DeliveryController.deliveryRepository.findAll(
        filter,
        { limit, offset }
      );

      res.json(result);
    } catch (error) {
      console.error('Error listing deliveries:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * @swagger
   * /api/deliveries:
   *   post:
   *     summary: Create delivery record
   *     description: Create a new delivery record with calculated cost breakdown
   *     tags: [Deliveries]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - originId
   *               - destinationId
   *               - vehicleId
   *               - demand
   *               - deliveryDate
   *             properties:
   *               originId:
   *                 type: string
   *                 format: uuid
   *                 description: Origin premise ID
   *               destinationId:
   *                 type: string
   *                 format: uuid
   *                 description: Destination premise ID
   *               vehicleId:
   *                 type: string
   *                 format: uuid
   *                 description: Vehicle ID
   *               demand:
   *                 type: integer
   *                 minimum: 1
   *                 description: Number of cases to deliver
   *                 example: 500
   *               deliveryDate:
   *                 type: string
   *                 format: date-time
   *                 description: Scheduled delivery date (ISO 8601)
   *     responses:
   *       201:
   *         description: Delivery created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *       400:
   *         description: Validation error or capacity constraint
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Authentication required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Origin, destination, or vehicle not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = createDeliverySchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            timestamp: new Date().toISOString(),
            details: validation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }

      const { originId, destinationId, vehicleId, demand, deliveryDate } = validation.data;

      // Fetch required data for cost calculation
      const [origin, destination, vehicle] = await Promise.all([
        DeliveryController.premiseRepository.findById(originId),
        DeliveryController.premiseRepository.findById(destinationId),
        DeliveryController.vehicleRepository.findById(vehicleId),
      ]);

      // Validate entities exist
      if (!origin) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Origin premise not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!destination) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Destination premise not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!vehicle) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Vehicle not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Calculate cost breakdown
      const costBreakdown = DeliveryController.costCalculationService.calculateDeliveryCost({
        origin: {
          latitude: origin.latitude,
          longitude: origin.longitude,
          elevation: origin.elevation,
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
          elevation: destination.elevation,
        },
        vehicle: {
          id: vehicle.id,
          name: vehicle.name,
          type: vehicle.type,
          capacity: vehicle.capacity,
          fuelConsumptionRate: vehicle.fuelConsumptionRate,
          co2EmissionRate: vehicle.co2EmissionRate,
          hourlyLaborCost: vehicle.hourlyLaborCost,
          fixedCostPerDelivery: vehicle.fixedCostPerDelivery,
        },
        demand,
      });

      // Create delivery record
      const delivery = await DeliveryController.deliveryRepository.create({
        originId,
        destinationId,
        vehicleId,
        demand,
        distance: costBreakdown.distance,
        duration: costBreakdown.duration,
        fuelCost: costBreakdown.fuelCost,
        laborCost: costBreakdown.laborCost,
        vehicleCost: costBreakdown.vehicleCost,
        carbonCost: costBreakdown.carbonCost,
        totalCost: costBreakdown.totalCost,
        co2Emissions: costBreakdown.co2Emissions,
        isAlpine: costBreakdown.isAlpine,
        hasOvertime: costBreakdown.hasOvertime,
        deliveryDate: new Date(deliveryDate),
      });

      // Blockchain Hook: Record dispatched movement
      // Assuming 'demand' is quantity and item is generic 'Red Bull Case' for this demo
      InventoryChainService.recordMovement({
        deliveryId: delivery.id,
        itemId: `ITEM-${delivery.id.substring(0, 8)}`, // Simulated Item ID
        fromLocation: origin.id,
        toLocation: destination.id,
        quantity: demand,
        movementType: 'DISPATCHED'
      }).catch(err => console.error('Blockchain hook failed:', err));

      res.status(201).json(delivery);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Capacity constraint violation')) {
        res.status(400).json({
          error: {
            code: 'CAPACITY_CONSTRAINT',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        console.error('Error creating delivery:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  }
}