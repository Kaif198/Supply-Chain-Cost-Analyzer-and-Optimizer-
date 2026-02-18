import { Request, Response } from 'express';
import { z } from 'zod';
import { PremiseRepository } from '../repositories/PremiseRepository';

// Validation schemas
const createPremiseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  category: z.enum(['nightclub', 'gym', 'retail', 'restaurant', 'hotel'], {
    errorMap: () => ({ message: 'Category must be one of: nightclub, gym, retail, restaurant, hotel' }),
  }),
  address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters'),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  elevation: z.number().min(0, 'Elevation must be non-negative').optional(),
  weeklyDemand: z.number().int().positive('Weekly demand must be a positive integer'),
});

const updatePremiseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  category: z.enum(['nightclub', 'gym', 'retail', 'restaurant', 'hotel']).optional(),
  address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters').optional(),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional(),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional(),
  elevation: z.number().min(0, 'Elevation must be non-negative').optional(),
  weeklyDemand: z.number().int().positive('Weekly demand must be a positive integer').optional(),
});

const listPremisesSchema = z.object({
  category: z.enum(['nightclub', 'gym', 'retail', 'restaurant', 'hotel']).optional(),
  search: z.string().max(255, 'Search query must be less than 255 characters').optional(),
});

export class PremiseController {
  private static premiseRepository = new PremiseRepository();

  /**
   * GET /api/premises
   * List premises with filtering
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validation = listPremisesSchema.safeParse(req.query);
      
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

      const { category, search } = validation.data;

      const premises = await PremiseController.premiseRepository.findAll({
        category,
        search,
      });

      res.json(premises);
    } catch (error) {
      console.error('Error listing premises:', error);
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
   * GET /api/premises/:id
   * Get premise details
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
            message: 'Invalid premise ID format',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const premise = await PremiseController.premiseRepository.findById(id);

      if (!premise) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Premise not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.json(premise);
    } catch (error) {
      console.error('Error fetching premise:', error);
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
   * POST /api/premises
   * Create premise
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = createPremiseSchema.safeParse(req.body);
      
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

      const premiseData = validation.data;

      const premise = await PremiseController.premiseRepository.create(premiseData);

      res.status(201).json(premise);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Austrian boundaries')) {
          res.status(400).json({
            error: {
              code: 'BOUNDARY_VIOLATION',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        if (error.message.includes('Weekly demand') || error.message.includes('Category')) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }
      }

      console.error('Error creating premise:', error);
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
   * PUT /api/premises/:id
   * Update premise
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
            message: 'Invalid premise ID format',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Validate request body
      const validation = updatePremiseSchema.safeParse(req.body);
      
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

      // Check if premise exists
      const exists = await PremiseController.premiseRepository.exists(id);
      if (!exists) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Premise not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const premise = await PremiseController.premiseRepository.update(id, updateData);

      res.json(premise);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Austrian boundaries')) {
          res.status(400).json({
            error: {
              code: 'BOUNDARY_VIOLATION',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }

        if (error.message.includes('Weekly demand') || error.message.includes('Category')) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
          return;
        }
      }

      console.error('Error updating premise:', error);
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
   * DELETE /api/premises/:id
   * Delete premise
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid premise ID format',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Check if premise exists
      const exists = await PremiseController.premiseRepository.exists(id);
      if (!exists) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Premise not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      await PremiseController.premiseRepository.delete(id);

      res.json({
        message: 'Premise deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('associated deliveries')) {
        res.status(409).json({
          error: {
            code: 'CONFLICT',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      console.error('Error deleting premise:', error);
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