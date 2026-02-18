import { Request, Response } from 'express';
import { z } from 'zod';
import { AnalyticsService } from '../services/AnalyticsService';
import prisma from '../utils/prisma';

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().datetime('Start date must be a valid ISO datetime'),
  endDate: z.string().datetime('End date must be a valid ISO datetime'),
});

const costTrendsSchema = dateRangeSchema.extend({
  granularity: z.enum(['daily', 'weekly', 'monthly'], {
    errorMap: () => ({ message: 'Granularity must be one of: daily, weekly, monthly' }),
  }).optional().default('daily'),
});

const topItemsSchema = dateRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

const exportSchema = z.object({
  format: z.enum(['csv', 'pdf'], {
    errorMap: () => ({ message: 'Format must be either csv or pdf' }),
  }),
  dateRange: dateRangeSchema,
});

export class AnalyticsController {
  private static analyticsService = new AnalyticsService(prisma);

  /**
   * GET /api/analytics/kpis
   * Get KPI metrics
   */
  static async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validation = dateRangeSchema.safeParse(req.query);
      
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

      const { startDate, endDate } = validation.data;

      const kpis = await AnalyticsController.analyticsService.getKPIs({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      res.json(kpis);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
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
   * GET /api/analytics/cost-trends
   * Get cost trends
   */
  static async getCostTrends(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validation = costTrendsSchema.safeParse(req.query);
      
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

      const { startDate, endDate, granularity } = validation.data;

      const trends = await AnalyticsController.analyticsService.getCostTrends(
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        granularity
      );

      res.json(trends);
    } catch (error) {
      console.error('Error fetching cost trends:', error);
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
   * GET /api/analytics/fleet-utilization
   * Get fleet metrics
   */
  static async getFleetUtilization(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validation = dateRangeSchema.safeParse(req.query);
      
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

      const { startDate, endDate } = validation.data;

      const fleetMetrics = await AnalyticsController.analyticsService.getFleetUtilization({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      res.json(fleetMetrics);
    } catch (error) {
      console.error('Error fetching fleet utilization:', error);
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
   * GET /api/analytics/top-routes
   * Get top routes
   */
  static async getTopRoutes(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validation = topItemsSchema.safeParse(req.query);
      
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

      const { startDate, endDate, limit } = validation.data;

      const topRoutes = await AnalyticsController.analyticsService.getTopRoutes(
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        limit
      );

      res.json(topRoutes);
    } catch (error) {
      console.error('Error fetching top routes:', error);
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
   * GET /api/analytics/top-premises
   * Get top premises
   */
  static async getTopPremises(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validation = topItemsSchema.safeParse(req.query);
      
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

      const { startDate, endDate, limit } = validation.data;

      const topPremises = await AnalyticsController.analyticsService.getTopPremises(
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        limit
      );

      res.json(topPremises);
    } catch (error) {
      console.error('Error fetching top premises:', error);
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
   * POST /api/analytics/export
   * Export data (CSV/PDF)
   */
  static async export(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = exportSchema.safeParse(req.body);
      
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

      const { format, dateRange } = validation.data;

      // Get analytics data for export
      const [kpis, trends, fleetMetrics, topRoutes, topPremises] = await Promise.all([
        AnalyticsController.analyticsService.getKPIs({
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        }),
        AnalyticsController.analyticsService.getCostTrends(
          {
            startDate: new Date(dateRange.startDate),
            endDate: new Date(dateRange.endDate),
          },
          'daily'
        ),
        AnalyticsController.analyticsService.getFleetUtilization({
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        }),
        AnalyticsController.analyticsService.getTopRoutes({
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        }),
        AnalyticsController.analyticsService.getTopPremises({
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        }),
      ]);

      if (format === 'csv') {
        // Generate CSV export
        const csvData = AnalyticsController.generateCSV({
          kpis,
          trends,
          fleetMetrics,
          topRoutes,
          topPremises,
        });

        const filename = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvData);
      } else if (format === 'pdf') {
        // For now, return a placeholder response for PDF export
        // In a real implementation, you would use a PDF generation library like puppeteer or jsPDF
        res.status(501).json({
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'PDF export is not yet implemented',
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Error exporting analytics data:', error);
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
   * Generate CSV data from analytics
   */
  private static generateCSV(data: any): string {
    const { kpis, trends, fleetMetrics, topRoutes, topPremises } = data;

    let csv = 'Analytics Export\n\n';

    // KPIs section
    csv += 'KPI Metrics\n';
    csv += 'Metric,Value\n';
    csv += `Total Deliveries,${kpis.totalDeliveries}\n`;
    csv += `Total Cost,€${kpis.totalCost.toFixed(2)}\n`;
    csv += `Total Distance,${kpis.totalDistance.toFixed(2)} km\n`;
    csv += `Total CO2,${kpis.totalCO2.toFixed(2)} kg\n`;
    csv += `Average Cost per Delivery,€${kpis.averageCostPerDelivery.toFixed(2)}\n`;
    csv += `Average Distance per Delivery,${kpis.averageDistancePerDelivery.toFixed(2)} km\n\n`;

    // Cost trends section
    csv += 'Cost Trends\n';
    csv += 'Date,Total Cost,Fuel Cost,Labor Cost,Vehicle Cost,Carbon Cost\n';
    trends.forEach((trend: any) => {
      csv += `${trend.date},€${trend.totalCost.toFixed(2)},€${trend.fuelCost.toFixed(2)},€${trend.laborCost.toFixed(2)},€${trend.vehicleCost.toFixed(2)},€${trend.carbonCost.toFixed(2)}\n`;
    });
    csv += '\n';

    // Fleet metrics section
    csv += 'Fleet Utilization\n';
    csv += 'Vehicle Type,Vehicle Name,Total Deliveries,Capacity Used,Capacity Available,Utilization %\n';
    fleetMetrics.forEach((fleet: any) => {
      csv += `${fleet.vehicleType},${fleet.vehicleName},${fleet.totalDeliveries},${fleet.capacityUsed},${fleet.capacityAvailable},${fleet.utilizationPercentage.toFixed(2)}%\n`;
    });
    csv += '\n';

    // Top routes section
    csv += 'Top Routes\n';
    csv += 'Route ID,Date,Total Cost,Total Distance,Stop Count,Vehicle Type\n';
    topRoutes.forEach((route: any) => {
      csv += `${route.routeId},${route.date.toISOString().split('T')[0]},€${route.totalCost.toFixed(2)},${route.totalDistance.toFixed(2)} km,${route.stopCount},${route.vehicleType}\n`;
    });
    csv += '\n';

    // Top premises section
    csv += 'Top Premises\n';
    csv += 'Premise ID,Premise Name,Delivery Count,Total Cost,Category\n';
    topPremises.forEach((premise: any) => {
      csv += `${premise.premiseId},${premise.premiseName},${premise.deliveryCount},€${premise.totalCost.toFixed(2)},${premise.category}\n`;
    });

    return csv;
  }
}