import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { RouteController } from './RouteController';

describe('RouteController', () => {
  describe('optimize', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let jsonMock: ReturnType<typeof vi.fn>;
    let statusMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      jsonMock = vi.fn();
      statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      
      mockReq = {
        body: {
          premiseIds: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
          vehicleId: '550e8400-e29b-41d4-a716-446655440003',
          mode: 'fastest',
        },
      };
      
      mockRes = {
        json: jsonMock,
        status: statusMock,
      };
    });

    it('should include mode parameter in response', async () => {
      // Mock the repositories and service
      const mockPremise1 = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Premise 1',
        category: 'nightclub',
        address: 'Address 1',
        latitude: 47.8,
        longitude: 13.0,
        elevation: 500,
        weeklyDemand: 50,
      };

      const mockPremise2 = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Premise 2',
        category: 'gym',
        address: 'Address 2',
        latitude: 47.9,
        longitude: 13.1,
        elevation: 600,
        weeklyDemand: 30,
      };

      const mockVehicle = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Small Van',
        type: 'small_van',
        capacity: 100,
        fuelConsumptionRate: 0.12,
        co2EmissionRate: 2.5,
        hourlyLaborCost: 25,
        fixedCostPerDelivery: 10,
      };

      const mockWarehouse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Fuschl am See',
        address: 'Warehouse Address',
        latitude: 47.8011,
        longitude: 13.2760,
        elevation: 663,
      };

      // Mock repository methods
      vi.spyOn(RouteController['premiseRepository'], 'findById')
        .mockResolvedValueOnce(mockPremise1 as any)
        .mockResolvedValueOnce(mockPremise2 as any);
      
      vi.spyOn(RouteController['vehicleRepository'], 'findById')
        .mockResolvedValue(mockVehicle as any);

      // Mock Prisma warehouse query
      const prismaMock = await import('../utils/prisma');
      vi.spyOn(prismaMock.default.warehouse, 'findFirst')
        .mockResolvedValue(mockWarehouse as any);

      // Mock the optimization service
      const mockOptimizedRoute = {
        sequence: [mockWarehouse, mockPremise1, mockPremise2, mockWarehouse],
        totalDistance: 100,
        totalCost: 50,
        totalDuration: 2,
        totalCO2: 10,
        segmentDetails: [
          { from: mockWarehouse, to: mockPremise1, distance: 30, cost: 15, duration: 0.5, co2: 3 },
          { from: mockPremise1, to: mockPremise2, distance: 40, cost: 20, duration: 0.7, co2: 4 },
          { from: mockPremise2, to: mockWarehouse, distance: 30, cost: 15, duration: 0.8, co2: 3 },
        ],
        capacityExceeded: false,
      };

      vi.spyOn(RouteController['routeOptimizationService'], 'optimizeRoute')
        .mockReturnValue(mockOptimizedRoute as any);

      // Execute
      await RouteController.optimize(mockReq as Request, mockRes as Response);

      // Verify response includes mode
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'fastest',
          vehicle: expect.any(Object),
          route: expect.any(Array),
          totals: expect.objectContaining({
            distance: 100,
            cost: 50,
            duration: 2,
            co2: 10,
          }),
        })
      );
    });

    it('should pass mode parameter to optimization service', async () => {
      // Setup mocks similar to above
      const mockPremise = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Premise 1',
        category: 'nightclub',
        address: 'Address 1',
        latitude: 47.8,
        longitude: 13.0,
        elevation: 500,
        weeklyDemand: 50,
      };

      const mockVehicle = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Small Van',
        type: 'small_van',
        capacity: 100,
        fuelConsumptionRate: 0.12,
        co2EmissionRate: 2.5,
        hourlyLaborCost: 25,
        fixedCostPerDelivery: 10,
      };

      const mockWarehouse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Fuschl am See',
        address: 'Warehouse Address',
        latitude: 47.8011,
        longitude: 13.2760,
        elevation: 663,
      };

      vi.spyOn(RouteController['premiseRepository'], 'findById')
        .mockResolvedValue(mockPremise as any);
      
      vi.spyOn(RouteController['vehicleRepository'], 'findById')
        .mockResolvedValue(mockVehicle as any);

      const prismaMock = await import('../utils/prisma');
      vi.spyOn(prismaMock.default.warehouse, 'findFirst')
        .mockResolvedValue(mockWarehouse as any);

      const optimizeSpy = vi.spyOn(RouteController['routeOptimizationService'], 'optimizeRoute')
        .mockReturnValue({
          sequence: [mockWarehouse, mockPremise, mockWarehouse],
          totalDistance: 60,
          totalCost: 30,
          totalDuration: 1,
          totalCO2: 6,
          segmentDetails: [],
          capacityExceeded: false,
        } as any);

      // Test with different modes
      const modes = ['fastest', 'cheapest', 'greenest', 'balanced'] as const;
      
      for (const mode of modes) {
        mockReq.body.mode = mode;
        await RouteController.optimize(mockReq as Request, mockRes as Response);
        
        expect(optimizeSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            mode,
          })
        );
      }
    });
  });
});
