import { PrismaClient } from '@prisma/client';
import { cacheClient } from '../utils/redis';
import {
  DateRange,
  KPIMetrics,
  TrendData,
  FleetMetrics,
  RouteMetrics,
  PremiseMetrics,
  Granularity,
} from '../types/analytics';

/**
 * AnalyticsService
 * 
 * Provides analytics and KPI calculations with Redis caching for performance.
 * Implements time-based aggregations, fleet utilization, and ranking metrics.
 * 
 * Requirements: 4.1, 4.2, 4.4, 4.6, 9.5, 9.7, 20.5
 */
export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get KPI metrics for the specified date range
   * 
   * @param dateRange - Date range for metrics calculation
   * @returns KPI metrics with totals and averages
   */
  async getKPIs(dateRange: DateRange): Promise<KPIMetrics> {
    const cacheKey = cacheClient.generateAnalyticsKey(
      'kpis',
      `${dateRange.startDate.toISOString()}-${dateRange.endDate.toISOString()}`
    );

    // Try to get from cache first
    const cached = await cacheClient.get<KPIMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate KPIs from database
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        deliveryDate: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    });

    const totalDeliveries = deliveries.length;
    const totalCost = deliveries.reduce((sum, d) => sum + d.totalCost, 0);
    const totalDistance = deliveries.reduce((sum, d) => sum + d.distance, 0);
    const totalCO2 = deliveries.reduce((sum, d) => sum + d.co2Emissions, 0);

    const kpis: KPIMetrics = {
      totalDeliveries,
      totalCost,
      totalDistance,
      totalCO2,
      averageCostPerDelivery: totalDeliveries > 0 ? totalCost / totalDeliveries : 0,
      averageDistancePerDelivery: totalDeliveries > 0 ? totalDistance / totalDeliveries : 0,
    };

    // Cache the result
    await cacheClient.set(cacheKey, kpis);

    return kpis;
  }

  /**
   * Get cost trends with time-based aggregation
   * 
   * @param dateRange - Date range for trend analysis
   * @param granularity - Aggregation level (daily, weekly, monthly)
   * @returns Array of trend data points
   */
  async getCostTrends(dateRange: DateRange, granularity: Granularity): Promise<TrendData[]> {
    const cacheKey = cacheClient.generateAnalyticsKey(
      'cost-trends',
      `${dateRange.startDate.toISOString()}-${dateRange.endDate.toISOString()}`,
      granularity
    );

    // Try to get from cache first
    const cached = await cacheClient.get<TrendData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get raw delivery data
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        deliveryDate: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      orderBy: {
        deliveryDate: 'asc',
      },
    });

    // Group by time period
    const groupedData = this.groupDeliveriesByTime(deliveries, granularity);

    // Calculate trends
    const trends: TrendData[] = Object.entries(groupedData).map(([date, deliveries]) => ({
      date,
      totalCost: deliveries.reduce((sum, d) => sum + d.totalCost, 0),
      fuelCost: deliveries.reduce((sum, d) => sum + d.fuelCost, 0),
      laborCost: deliveries.reduce((sum, d) => sum + d.laborCost, 0),
      vehicleCost: deliveries.reduce((sum, d) => sum + d.vehicleCost, 0),
      carbonCost: deliveries.reduce((sum, d) => sum + d.carbonCost, 0),
    }));

    // Cache the result
    await cacheClient.set(cacheKey, trends);

    return trends;
  }

  /**
   * Get fleet utilization metrics
   * 
   * @param dateRange - Date range for utilization calculation
   * @returns Fleet utilization metrics by vehicle type
   */
  async getFleetUtilization(dateRange: DateRange): Promise<FleetMetrics[]> {
    const cacheKey = cacheClient.generateAnalyticsKey(
      'fleet-utilization',
      `${dateRange.startDate.toISOString()}-${dateRange.endDate.toISOString()}`
    );

    // Try to get from cache first
    const cached = await cacheClient.get<FleetMetrics[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get vehicles with their deliveries
    const vehicles = await this.prisma.vehicle.findMany({
      include: {
        deliveries: {
          where: {
            deliveryDate: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
        },
      },
    });

    const fleetMetrics: FleetMetrics[] = vehicles.map((vehicle) => {
      const totalDeliveries = vehicle.deliveries.length;
      const capacityUsed = vehicle.deliveries.reduce((sum, d) => sum + d.demand, 0);
      const capacityAvailable = vehicle.capacity * totalDeliveries;
      const utilizationPercentage = capacityAvailable > 0 ? (capacityUsed / capacityAvailable) * 100 : 0;

      return {
        vehicleType: vehicle.type,
        vehicleName: vehicle.name,
        totalDeliveries,
        capacityUsed,
        capacityAvailable,
        utilizationPercentage,
      };
    });

    // Cache the result
    await cacheClient.set(cacheKey, fleetMetrics);

    return fleetMetrics;
  }

  /**
   * Get top routes by cost
   * 
   * @param dateRange - Date range for route analysis
   * @param limit - Maximum number of routes to return
   * @returns Top routes ranked by total cost
   */
  async getTopRoutes(dateRange: DateRange, limit: number = 10): Promise<RouteMetrics[]> {
    const cacheKey = cacheClient.generateAnalyticsKey(
      'top-routes',
      `${dateRange.startDate.toISOString()}-${dateRange.endDate.toISOString()}`,
      limit.toString()
    );

    // Try to get from cache first
    const cached = await cacheClient.get<RouteMetrics[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get routes with vehicle information
    const routes = await this.prisma.route.findMany({
      where: {
        routeDate: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      include: {
        vehicle: true,
        stops: true,
      },
      orderBy: {
        totalCost: 'desc',
      },
      take: limit,
    });

    const topRoutes: RouteMetrics[] = routes.map((route) => ({
      routeId: route.id,
      date: route.routeDate,
      totalCost: route.totalCost,
      totalDistance: route.totalDistance,
      stopCount: route.stops.length,
      vehicleType: route.vehicle.type,
    }));

    // Cache the result
    await cacheClient.set(cacheKey, topRoutes);

    return topRoutes;
  }

  /**
   * Get top premises by delivery frequency and cost
   * 
   * @param dateRange - Date range for premise analysis
   * @param limit - Maximum number of premises to return
   * @returns Top premises ranked by delivery count
   */
  async getTopPremises(dateRange: DateRange, limit: number = 10): Promise<PremiseMetrics[]> {
    const cacheKey = cacheClient.generateAnalyticsKey(
      'top-premises',
      `${dateRange.startDate.toISOString()}-${dateRange.endDate.toISOString()}`,
      limit.toString()
    );

    // Try to get from cache first
    const cached = await cacheClient.get<PremiseMetrics[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get premises with their delivery statistics
    const premiseStats = await this.prisma.premise.findMany({
      include: {
        deliveriesTo: {
          where: {
            deliveryDate: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
        },
      },
    });

    // Calculate metrics and sort by delivery count
    const premiseMetrics: PremiseMetrics[] = premiseStats
      .map((premise) => ({
        premiseId: premise.id,
        premiseName: premise.name,
        deliveryCount: premise.deliveriesTo.length,
        totalCost: premise.deliveriesTo.reduce((sum, d) => sum + d.totalCost, 0),
        category: premise.category,
      }))
      .filter((metric) => metric.deliveryCount > 0)
      .sort((a, b) => b.deliveryCount - a.deliveryCount)
      .slice(0, limit);

    // Cache the result
    await cacheClient.set(cacheKey, premiseMetrics);

    return premiseMetrics;
  }

  /**
   * Group deliveries by time period for trend analysis
   * 
   * @param deliveries - Array of deliveries to group
   * @param granularity - Time grouping granularity
   * @returns Grouped deliveries by time period
   */
  private groupDeliveriesByTime(
    deliveries: any[],
    granularity: Granularity
  ): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    deliveries.forEach((delivery) => {
      const date = new Date(delivery.deliveryDate);
      let key: string;

      switch (granularity) {
        case 'daily':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'weekly':
          // Get Monday of the week
          const monday = new Date(date);
          monday.setDate(date.getDate() - date.getDay() + 1);
          key = monday.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(delivery);
    });

    return grouped;
  }

  /**
   * Clear analytics cache
   * 
   * @returns Success status
   */
  async clearCache(): Promise<boolean> {
    return await cacheClient.flush();
  }
}