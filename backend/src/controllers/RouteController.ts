import { Request, Response } from 'express';
import { z } from 'zod';
import { RouteOptimizationService } from '../services/RouteOptimizationService';
import { RouteRepository } from '../repositories/RouteRepository';
import { PremiseRepository } from '../repositories/PremiseRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import prisma from '../utils/prisma';

// Validation schemas
const optimizeRouteSchema = z.object({
  premiseIds: z.array(z.string().uuid('Premise ID must be a valid UUID')).min(1, 'At least one premise is required'),
  vehicleId: z.string().uuid('Vehicle ID must be a valid UUID'),
  mode: z.enum(['fastest', 'cheapest', 'greenest', 'balanced'], {
    errorMap: () => ({ message: 'Mode must be one of: fastest, cheapest, greenest, balanced' }),
  }),
});

export class RouteController {
  private static routeOptimizationService = new RouteOptimizationService();
  private static routeRepository = new RouteRepository();
  private static premiseRepository = new PremiseRepository();
  private static vehicleRepository = new VehicleRepository();

  /**
   * @swagger
   * /api/routes/optimize:
   *   post:
   *     summary: Optimize multi-stop route
   *     description: Calculate optimal route sequence for multiple premises based on selected optimization mode
   *     tags: [Routes]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - premiseIds
   *               - vehicleId
   *               - mode
   *             properties:
   *               premiseIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *                 minItems: 1
   *                 description: Array of premise IDs to visit
   *               vehicleId:
   *                 type: string
   *                 format: uuid
   *                 description: Vehicle ID
   *               mode:
   *                 type: string
   *                 enum: [fastest, cheapest, greenest, balanced]
   *                 description: Optimization mode
   *     responses:
   *       200:
   *         description: Route optimized successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OptimizedRoute'
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
   *       404:
   *         description: Premises, vehicle, or warehouse not found
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
  static async optimize(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = optimizeRouteSchema.safeParse(req.body);
      
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

      const { premiseIds, vehicleId, mode } = validation.data;

      // Fetch required data
      const [premises, vehicle, warehouse] = await Promise.all([
        Promise.all(premiseIds.map(id => RouteController.premiseRepository.findById(id))),
        RouteController.vehicleRepository.findById(vehicleId),
        // Get warehouse (assuming there's only one warehouse)
        prisma.warehouse.findFirst(),
      ]);

      // Validate all premises exist
      const missingPremises = premises.map((premise, index) => 
        premise ? null : premiseIds[index]
      ).filter(Boolean);

      if (missingPremises.length > 0) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Premises not found: ${missingPremises.join(', ')}`,
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

      if (!warehouse) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Warehouse not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Calculate total demand
      const totalDemand = premises.reduce((sum, premise) => sum + (premise?.weeklyDemand || 0), 0);

      // Convert to service types
      const servicePremises = premises.filter(Boolean).map(premise => ({
        id: premise!.id,
        name: premise!.name,
        category: premise!.category,
        address: premise!.address,
        latitude: premise!.latitude,
        longitude: premise!.longitude,
        elevation: premise!.elevation,
        weeklyDemand: premise!.weeklyDemand,
      }));

      const serviceVehicle = {
        id: vehicle.id,
        name: vehicle.name,
        type: vehicle.type,
        capacity: vehicle.capacity,
        fuelConsumptionRate: vehicle.fuelConsumptionRate,
        co2EmissionRate: vehicle.co2EmissionRate,
        hourlyLaborCost: vehicle.hourlyLaborCost,
        fixedCostPerDelivery: vehicle.fixedCostPerDelivery,
      };

      const serviceWarehouse = {
        id: warehouse.id,
        name: warehouse.name,
        address: warehouse.address,
        latitude: warehouse.latitude,
        longitude: warehouse.longitude,
        elevation: warehouse.elevation,
      };

      // Optimize route
      const optimizedRoute = RouteController.routeOptimizationService.optimizeRoute({
        premises: servicePremises,
        vehicle: serviceVehicle,
        warehouse: serviceWarehouse,
        mode,
        totalDemand,
      });

      // Transform response to match frontend expectations
      const response = {
        route: optimizedRoute.sequence.map((location, index) => ({
          sequence: index + 1,
          premise: location,
          distance: optimizedRoute.segmentDetails[index]?.distance || 0,
          cost: optimizedRoute.segmentDetails[index]?.cost || 0,
          duration: optimizedRoute.segmentDetails[index]?.duration || 0,
          co2: optimizedRoute.segmentDetails[index]?.co2 || 0,
        })),
        totals: {
          distance: optimizedRoute.totalDistance,
          cost: optimizedRoute.totalCost,
          duration: optimizedRoute.totalDuration,
          co2: optimizedRoute.totalCO2,
        },
        mode,
        vehicle: serviceVehicle,
      };

      res.json(response);
    } catch (error) {
      console.error('Error optimizing route:', error);
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
   * /api/routes/{id}:
   *   get:
   *     summary: Get route details
   *     description: Retrieve details of a specific route by ID
   *     tags: [Routes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Route ID
   *     responses:
   *       200:
   *         description: Route retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *       400:
   *         description: Invalid route ID format
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
   *         description: Route not found
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
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid route ID format',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const route = await RouteController.routeRepository.findById(id);

      if (!route) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Route not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.json(route);
    } catch (error) {
      console.error('Error fetching route:', error);
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
   * POST /api/routes
   * Save optimized route
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const createRouteSchema = z.object({
        vehicleId: z.string().uuid('Vehicle ID must be a valid UUID'),
        mode: z.enum(['fastest', 'cheapest', 'greenest', 'balanced']),
        totalDistance: z.number().positive('Total distance must be positive'),
        totalCost: z.number().positive('Total cost must be positive'),
        totalDuration: z.number().positive('Total duration must be positive'),
        totalCO2: z.number().min(0, 'Total CO2 must be non-negative'),
        routeDate: z.string().datetime('Route date must be a valid ISO datetime'),
        stops: z.array(z.object({
          premiseId: z.string().uuid('Premise ID must be a valid UUID'),
          sequence: z.number().int().min(0, 'Sequence must be non-negative'),
          distance: z.number().min(0, 'Distance must be non-negative'),
          cost: z.number().min(0, 'Cost must be non-negative'),
          duration: z.number().min(0, 'Duration must be non-negative'),
          co2: z.number().min(0, 'CO2 must be non-negative'),
        })).min(1, 'At least one stop is required'),
      });

      // Validate request body
      const validation = createRouteSchema.safeParse(req.body);
      
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

      const data = validation.data;

      // Verify vehicle exists
      const vehicle = await RouteController.vehicleRepository.findById(data.vehicleId);
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

      // Verify all premises exist
      const premiseIds = data.stops.map(stop => stop.premiseId);
      const premises = await Promise.all(
        premiseIds.map(id => RouteController.premiseRepository.findById(id))
      );

      const missingPremises = premises.map((premise, index) => 
        premise ? null : premiseIds[index]
      ).filter(Boolean);

      if (missingPremises.length > 0) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Premises not found: ${missingPremises.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Create route
      const route = await RouteController.routeRepository.create({
        vehicleId: data.vehicleId,
        mode: data.mode,
        totalDistance: data.totalDistance,
        totalCost: data.totalCost,
        totalDuration: data.totalDuration,
        totalCO2: data.totalCO2,
        routeDate: new Date(data.routeDate),
        stops: data.stops,
      });

      res.status(201).json(route);
    } catch (error) {
      console.error('Error creating route:', error);
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