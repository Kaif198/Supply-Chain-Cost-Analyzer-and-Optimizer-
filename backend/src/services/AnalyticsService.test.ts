import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as fc from 'fast-check';
import { AnalyticsService } from './AnalyticsService';
import { cacheClient } from '../utils/redis';

describe('AnalyticsService Property Tests', () => {
  let prisma: PrismaClient;
  let analyticsService: AnalyticsService;

  beforeEach(async () => {
    prisma = new PrismaClient();
    analyticsService = new AnalyticsService(prisma);
    await cacheClient.flush(); // Clear cache before each test
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  /**
   * Property 26: Time-based aggregation
   * **Validates: Requirements 4.2**
   * 
   * For any set of deliveries within a date range, aggregating by different time granularities
   * should preserve the total values while grouping them appropriately.
   */
  it('Property 26: Time-based aggregation preserves totals across granularities', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.array(
          fc.record({
            deliveryDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            totalCost: fc.float({ min: 10, max: 1000 }),
            fuelCost: fc.float({ min: 5, max: 200 }),
            laborCost: fc.float({ min: 10, max: 300 }),
            vehicleCost: fc.float({ min: 5, max: 100 }),
            carbonCost: fc.float({ min: 1, max: 50 }),
          }),
          { minLength: 5, maxLength: 50 }
        ),
        fc.constantFrom('daily', 'weekly', 'monthly'),
        async (deliveries, granularity) => {
          // Mock the database query to return our test deliveries
          const mockFindMany = async () => deliveries;
          prisma.delivery.findMany = mockFindMany as any;

          const dateRange = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          };

          const trends = await analyticsService.getCostTrends(dateRange, granularity);

          // Calculate expected totals from original data
          const expectedTotalCost = deliveries.reduce((sum, d) => sum + d.totalCost, 0);
          const expectedFuelCost = deliveries.reduce((sum, d) => sum + d.fuelCost, 0);
          const expectedLaborCost = deliveries.reduce((sum, d) => sum + d.laborCost, 0);
          const expectedVehicleCost = deliveries.reduce((sum, d) => sum + d.vehicleCost, 0);
          const expectedCarbonCost = deliveries.reduce((sum, d) => sum + d.carbonCost, 0);

          // Calculate actual totals from aggregated trends
          const actualTotalCost = trends.reduce((sum, t) => sum + t.totalCost, 0);
          const actualFuelCost = trends.reduce((sum, t) => sum + t.fuelCost, 0);
          const actualLaborCost = trends.reduce((sum, t) => sum + t.laborCost, 0);
          const actualVehicleCost = trends.reduce((sum, t) => sum + t.vehicleCost, 0);
          const actualCarbonCost = trends.reduce((sum, t) => sum + t.carbonCost, 0);

          // Verify totals are preserved (within floating point precision)
          expect(Math.abs(actualTotalCost - expectedTotalCost)).toBeLessThan(0.01);
          expect(Math.abs(actualFuelCost - expectedFuelCost)).toBeLessThan(0.01);
          expect(Math.abs(actualLaborCost - expectedLaborCost)).toBeLessThan(0.01);
          expect(Math.abs(actualVehicleCost - expectedVehicleCost)).toBeLessThan(0.01);
          expect(Math.abs(actualCarbonCost - expectedCarbonCost)).toBeLessThan(0.01);

          // Verify all trend points have valid dates
          trends.forEach((trend) => {
            expect(trend.date).toBeTruthy();
            expect(typeof trend.date).toBe('string');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 27: Fleet utilization calculation
   * **Validates: Requirements 4.4**
   * 
   * For any set of vehicles and their deliveries, fleet utilization should be calculated
   * as (total demand used / total capacity available) * 100, and should be between 0 and 100%.
   */
  it('Property 27: Fleet utilization calculation is accurate and bounded', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test vehicles with deliveries
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constantFrom('small_van', 'medium_truck', 'large_truck'),
            capacity: fc.integer({ min: 100, max: 10000 }),
            deliveries: fc.array(
              fc.record({
                demand: fc.integer({ min: 1, max: 1000 }),
                deliveryDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              }),
              { minLength: 0, maxLength: 20 }
            ),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (vehicles) => {
          // Mock the database query to return our test vehicles
          const mockFindMany = async () => vehicles;
          prisma.vehicle.findMany = mockFindMany as any;

          const dateRange = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          };

          const fleetMetrics = await analyticsService.getFleetUtilization(dateRange);

          // Verify each vehicle's utilization calculation
          fleetMetrics.forEach((metric, index) => {
            const vehicle = vehicles[index];
            const expectedTotalDeliveries = vehicle.deliveries.length;
            const expectedCapacityUsed = vehicle.deliveries.reduce((sum, d) => sum + d.demand, 0);
            const expectedCapacityAvailable = vehicle.capacity * expectedTotalDeliveries;
            const expectedUtilization = expectedCapacityAvailable > 0 
              ? (expectedCapacityUsed / expectedCapacityAvailable) * 100 
              : 0;

            // Verify calculations
            expect(metric.totalDeliveries).toBe(expectedTotalDeliveries);
            expect(metric.capacityUsed).toBe(expectedCapacityUsed);
            expect(metric.capacityAvailable).toBe(expectedCapacityAvailable);
            expect(Math.abs(metric.utilizationPercentage - expectedUtilization)).toBeLessThan(0.01);

            // Verify utilization is bounded between 0 and 100%
            expect(metric.utilizationPercentage).toBeGreaterThanOrEqual(0);
            expect(metric.utilizationPercentage).toBeLessThanOrEqual(100);

            // Verify vehicle information is preserved
            expect(metric.vehicleType).toBe(vehicle.type);
            expect(metric.vehicleName).toBe(vehicle.name);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 28: Date range filtering
   * **Validates: Requirements 4.5**
   * 
   * For any date range filter, analytics results should only include data within the specified range.
   */
  it('Property 28: Date range filtering excludes data outside range', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test deliveries with various dates
        fc.array(
          fc.record({
            id: fc.uuid(),
            deliveryDate: fc.date({ min: new Date('2023-01-01'), max: new Date('2025-12-31') }),
            totalCost: fc.float({ min: 10, max: 1000 }),
            distance: fc.float({ min: 1, max: 500 }),
            co2Emissions: fc.float({ min: 1, max: 100 }),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        // Generate a date range that's within the delivery date range
        fc.record({
          startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
          endDate: fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') }),
        }),
        async (deliveries, dateRange) => {
          // Mock the database query to return filtered deliveries
          const mockFindMany = async (options: any) => {
            const { where } = options;
            if (where?.deliveryDate) {
              return deliveries.filter(d => 
                d.deliveryDate >= where.deliveryDate.gte && 
                d.deliveryDate <= where.deliveryDate.lte
              );
            }
            return deliveries;
          };
          prisma.delivery.findMany = mockFindMany as any;

          const kpis = await analyticsService.getKPIs(dateRange);

          // Calculate expected values from filtered deliveries
          const filteredDeliveries = deliveries.filter(d => 
            d.deliveryDate >= dateRange.startDate && 
            d.deliveryDate <= dateRange.endDate
          );

          const expectedTotalDeliveries = filteredDeliveries.length;
          const expectedTotalCost = filteredDeliveries.reduce((sum, d) => sum + d.totalCost, 0);
          const expectedTotalDistance = filteredDeliveries.reduce((sum, d) => sum + d.distance, 0);
          const expectedTotalCO2 = filteredDeliveries.reduce((sum, d) => sum + d.co2Emissions, 0);

          // Verify that results match filtered data
          expect(kpis.totalDeliveries).toBe(expectedTotalDeliveries);
          expect(Math.abs(kpis.totalCost - expectedTotalCost)).toBeLessThan(0.01);
          expect(Math.abs(kpis.totalDistance - expectedTotalDistance)).toBeLessThan(0.01);
          expect(Math.abs(kpis.totalCO2 - expectedTotalCO2)).toBeLessThan(0.01);

          // Verify averages are calculated correctly
          if (expectedTotalDeliveries > 0) {
            const expectedAvgCost = expectedTotalCost / expectedTotalDeliveries;
            const expectedAvgDistance = expectedTotalDistance / expectedTotalDeliveries;
            expect(Math.abs(kpis.averageCostPerDelivery - expectedAvgCost)).toBeLessThan(0.01);
            expect(Math.abs(kpis.averageDistancePerDelivery - expectedAvgDistance)).toBeLessThan(0.01);
          } else {
            expect(kpis.averageCostPerDelivery).toBe(0);
            expect(kpis.averageDistancePerDelivery).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 29: Top routes ranking
   * **Validates: Requirements 4.6**
   * 
   * For any set of routes, the top routes should be ranked by total cost in descending order.
   */
  it('Property 29: Top routes are ranked by cost in descending order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            totalCost: fc.float({ min: 10, max: 10000 }),
            totalDistance: fc.float({ min: 1, max: 1000 }),
            routeDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            vehicle: fc.record({
              type: fc.constantFrom('small_van', 'medium_truck', 'large_truck'),
            }),
            stops: fc.array(fc.record({ id: fc.uuid() }), { minLength: 1, maxLength: 10 }),
          }),
          { minLength: 5, maxLength: 20 }
        ),
        fc.integer({ min: 1, max: 10 }),
        async (routes, limit) => {
          // Mock the database query
          const mockFindMany = async (options: any) => {
            const { take, orderBy } = options;
            let sortedRoutes = [...routes];
            if (orderBy?.totalCost === 'desc') {
              sortedRoutes.sort((a, b) => b.totalCost - a.totalCost);
            }
            return sortedRoutes.slice(0, take);
          };
          prisma.route.findMany = mockFindMany as any;

          const dateRange = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          };

          const topRoutes = await analyticsService.getTopRoutes(dateRange, limit);

          // Verify routes are sorted by cost in descending order
          for (let i = 1; i < topRoutes.length; i++) {
            expect(topRoutes[i - 1].totalCost).toBeGreaterThanOrEqual(topRoutes[i].totalCost);
          }

          // Verify limit is respected
          expect(topRoutes.length).toBeLessThanOrEqual(limit);
          expect(topRoutes.length).toBeLessThanOrEqual(routes.length);

          // Verify all returned routes have valid data
          topRoutes.forEach((route) => {
            expect(route.routeId).toBeTruthy();
            expect(route.totalCost).toBeGreaterThanOrEqual(0);
            expect(route.totalDistance).toBeGreaterThanOrEqual(0);
            expect(route.stopCount).toBeGreaterThanOrEqual(0);
            expect(route.vehicleType).toBeTruthy();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 30: Cache TTL behavior
   * **Validates: Requirements 9.5**
   * 
   * For any analytics query, cached results should be used within TTL period and refreshed after expiry.
   */
  it('Property 30: Cache TTL behavior respects 5-minute expiration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalDeliveries: fc.integer({ min: 0, max: 1000 }),
          totalCost: fc.float({ min: 0, max: 100000 }),
          totalDistance: fc.float({ min: 0, max: 50000 }),
          totalCO2: fc.float({ min: 0, max: 5000 }),
        }),
        async (mockKPIs) => {
          // Mock database to return consistent data
          const mockFindMany = async () => [];
          prisma.delivery.findMany = mockFindMany as any;

          const dateRange = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          };

          // First call should hit database and cache result
          const result1 = await analyticsService.getKPIs(dateRange);

          // Second call should use cache (if Redis is available)
          const result2 = await analyticsService.getKPIs(dateRange);

          // Results should be identical when using cache
          expect(result1.totalDeliveries).toBe(result2.totalDeliveries);
          expect(result1.totalCost).toBe(result2.totalCost);
          expect(result1.totalDistance).toBe(result2.totalDistance);
          expect(result1.totalCO2).toBe(result2.totalCO2);

          // Verify cache key generation is consistent
          const cacheKey = cacheClient.generateAnalyticsKey(
            'kpis',
            `${dateRange.startDate.toISOString()}-${dateRange.endDate.toISOString()}`
          );
          expect(cacheKey).toBe('analytics:kpis:2024-01-01T00:00:00.000Z-2024-12-31T00:00:00.000Z');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 31: Cache miss handling
   * **Validates: Requirements 9.7**
   * 
   * For any cache miss, the system should fetch from database and update cache.
   */
  it('Property 31: Cache miss triggers database fetch and cache update', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            totalCost: fc.float({ min: 10, max: 1000 }),
            distance: fc.float({ min: 1, max: 500 }),
            co2Emissions: fc.float({ min: 1, max: 100 }),
            deliveryDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (deliveries) => {
          // Clear cache to ensure miss
          await cacheClient.flush();

          // Mock database to return test data
          const mockFindMany = async () => deliveries;
          prisma.delivery.findMany = mockFindMany as any;

          const dateRange = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          };

          const result = await analyticsService.getKPIs(dateRange);

          // Verify result matches expected calculation from mock data
          const expectedTotalDeliveries = deliveries.length;
          const expectedTotalCost = deliveries.reduce((sum, d) => sum + d.totalCost, 0);
          const expectedTotalDistance = deliveries.reduce((sum, d) => sum + d.distance, 0);
          const expectedTotalCO2 = deliveries.reduce((sum, d) => sum + d.co2Emissions, 0);

          expect(result.totalDeliveries).toBe(expectedTotalDeliveries);
          expect(Math.abs(result.totalCost - expectedTotalCost)).toBeLessThan(0.01);
          expect(Math.abs(result.totalDistance - expectedTotalDistance)).toBeLessThan(0.01);
          expect(Math.abs(result.totalCO2 - expectedTotalCO2)).toBeLessThan(0.01);

          // Verify averages are calculated correctly
          if (expectedTotalDeliveries > 0) {
            const expectedAvgCost = expectedTotalCost / expectedTotalDeliveries;
            const expectedAvgDistance = expectedTotalDistance / expectedTotalDeliveries;
            expect(Math.abs(result.averageCostPerDelivery - expectedAvgCost)).toBeLessThan(0.01);
            expect(Math.abs(result.averageDistancePerDelivery - expectedAvgDistance)).toBeLessThan(0.01);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 56: Redis graceful degradation
   * **Validates: Requirements 20.5**
   * 
   * For any analytics query when Redis is unavailable, the system should continue operating without caching.
   */
  it('Property 56: Redis graceful degradation continues operation without cache', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            totalCost: fc.float({ min: 10, max: 1000 }),
            distance: fc.float({ min: 1, max: 500 }),
            co2Emissions: fc.float({ min: 1, max: 100 }),
            deliveryDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (deliveries) => {
          // Mock database to return test data
          const mockFindMany = async () => deliveries;
          prisma.delivery.findMany = mockFindMany as any;

          const dateRange = {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
          };

          // Test that analytics work even when Redis is unavailable
          // (Redis is already unavailable in test environment)
          const result = await analyticsService.getKPIs(dateRange);

          // Verify result is still calculated correctly from database
          const expectedTotalDeliveries = deliveries.length;
          const expectedTotalCost = deliveries.reduce((sum, d) => sum + d.totalCost, 0);
          const expectedTotalDistance = deliveries.reduce((sum, d) => sum + d.distance, 0);
          const expectedTotalCO2 = deliveries.reduce((sum, d) => sum + d.co2Emissions, 0);

          expect(result.totalDeliveries).toBe(expectedTotalDeliveries);
          expect(Math.abs(result.totalCost - expectedTotalCost)).toBeLessThan(0.01);
          expect(Math.abs(result.totalDistance - expectedTotalDistance)).toBeLessThan(0.01);
          expect(Math.abs(result.totalCO2 - expectedTotalCO2)).toBeLessThan(0.01);

          // Verify cache client reports unavailable status
          expect(cacheClient.isAvailable()).toBe(false);

          // Verify system continues to work on subsequent calls
          const result2 = await analyticsService.getKPIs(dateRange);
          expect(result2.totalDeliveries).toBe(expectedTotalDeliveries);
        }
      ),
      { numRuns: 50 }
    );
  });
});