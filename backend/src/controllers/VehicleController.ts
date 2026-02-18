import { Request, Response } from 'express';
import { z } from 'zod';
import { VehicleRepository } from '../repositories/VehicleRepository';

// Validation schemas
const updateVehicleSchema = z.object({
  fuelConsumptionRate: z.number().positive('Fuel consumption rate must be a positive number').optional(),
  co2EmissionRate: z.number().positive('CO2 emission rate must be a positive number').optional(),
  hourlyLaborCost: z.number().positive('Hourly labor cost must be a positive number').optional(),
  fixedCostPerDelivery: z.number().positive('Fixed cost per delivery must be a positive number').optional(),
});

export class VehicleController {
  private static vehicleRepository = new VehicleRepository();

  /**
   * GET /api/vehicles
   * List all vehicles
   */
  static async list(_req: Request, res: Response): Promise<void> {
    try {
      const vehicles = await VehicleController.vehicleRepository.findAll();
      res.json(vehicles);
    } catch (error) {
      console.error('Error listing vehicles:', error);
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
   * GET /api/vehicles/:id
   * Get vehicle details
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
            message: 'Invalid vehicle ID format',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const vehicle = await VehicleController.vehicleRepository.findById(id);

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

      res.json(vehicle);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
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
   * PUT /api/vehicles/:id
   * Update vehicle parameters
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid vehicle ID format',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Validate request body
      const validation = updateVehicleSchema.safeParse(req.body);
      
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

      const updateData = validation.data;

      // Check if vehicle exists
      const exists = await VehicleController.vehicleRepository.exists(id);
      if (!exists) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Vehicle not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const vehicle = await VehicleController.vehicleRepository.update(id, updateData);

      res.json(vehicle);
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('Fuel consumption rate') ||
        error.message.includes('CO2 emission rate') ||
        error.message.includes('Hourly labor cost') ||
        error.message.includes('Fixed cost per delivery')
      )) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      console.error('Error updating vehicle:', error);
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