import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { VehicleRepository, VehicleUpdateInput } from './VehicleRepository';
import prisma from '../utils/prisma';

describe('VehicleRepository', () => {
  const repository = new VehicleRepository();
  let testVehicleId: string;

  // Create a test vehicle before each test
  beforeEach(async () => {
    const vehicle = await prisma.vehicle.create({
      data: {
        name: 'Test Van',
        type: 'small_van',
        capacity: 800,
        fuelConsumptionRate: 0.12,
        co2EmissionRate: 0.28,
        hourlyLaborCost: 25,
        fixedCostPerDelivery: 15,
      },
    });
    testVehicleId = vehicle.id;
  });

  // Clean up test data after each test
  afterEach(async () => {
    await prisma.delivery.deleteMany({});
    await prisma.vehicle.deleteMany({});
  });

  // Arbitrary generators for property-based testing
  const arbitraryPositiveNumber = () => fc.double({ min: 0.01, max: 1000 });

  const arbitraryVehicleUpdateInput = (): fc.Arbitrary<VehicleUpdateInput> =>
    fc.record({
      fuelConsumptionRate: fc.option(arbitraryPositiveNumber(), { nil: undefined }),
      co2EmissionRate: fc.option(arbitraryPositiveNumber(), { nil: undefined }),
      hourlyLaborCost: fc.option(arbitraryPositiveNumber(), { nil: undefined }),
      fixedCostPerDelivery: fc.option(arbitraryPositiveNumber(), { nil: undefined }),
    });

  describe('Property 37: Vehicle parameter validation', () => {
    /**
     * **Validates: Requirements 6.4, 6.5**
     * For any vehicle update, capacity should be rejected if not a positive integer,
     * and cost parameters should be rejected if not positive decimals.
     */
    it('rejects non-positive fuel consumption rate', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: -100, max: 0 }),
          async (invalidRate) => {
            await expect(
              repository.update(testVehicleId, { fuelConsumptionRate: invalidRate })
            ).rejects.toThrow(/positive number/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('rejects non-positive CO2 emission rate', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: -100, max: 0 }),
          async (invalidRate) => {
            await expect(
              repository.update(testVehicleId, { co2EmissionRate: invalidRate })
            ).rejects.toThrow(/positive number/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('rejects non-positive hourly labor cost', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: -100, max: 0 }),
          async (invalidCost) => {
            await expect(
              repository.update(testVehicleId, { hourlyLaborCost: invalidCost })
            ).rejects.toThrow(/positive number/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('rejects non-positive fixed cost per delivery', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.double({ min: -100, max: 0 }),
          async (invalidCost) => {
            await expect(
              repository.update(testVehicleId, { fixedCostPerDelivery: invalidCost })
            ).rejects.toThrow(/positive number/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('accepts positive cost parameters', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryVehicleUpdateInput(), async (input) => {
          // Filter out undefined values for validation
          const hasPositiveValues = Object.values(input).some(
            (val) => val !== undefined && val > 0
          );

          if (hasPositiveValues) {
            const updated = await repository.update(testVehicleId, input);

            if (input.fuelConsumptionRate !== undefined) {
              expect(updated.fuelConsumptionRate).toBeGreaterThan(0);
            }
            if (input.co2EmissionRate !== undefined) {
              expect(updated.co2EmissionRate).toBeGreaterThan(0);
            }
            if (input.hourlyLaborCost !== undefined) {
              expect(updated.hourlyLaborCost).toBeGreaterThan(0);
            }
            if (input.fixedCostPerDelivery !== undefined) {
              expect(updated.fixedCostPerDelivery).toBeGreaterThan(0);
            }
          }
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 38: Vehicle update persistence', () => {
    /**
     * **Validates: Requirements 6.3, 16.6**
     * For any vehicle parameter update, querying the vehicle after update
     * should return the updated cost parameters.
     */
    it('persists vehicle parameter updates correctly', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryVehicleUpdateInput(), async (input) => {
          // Update vehicle
          const updated = await repository.update(testVehicleId, input);

          // Verify updates persisted in returned object
          if (input.fuelConsumptionRate !== undefined) {
            expect(updated.fuelConsumptionRate).toBeCloseTo(input.fuelConsumptionRate, 5);
          }
          if (input.co2EmissionRate !== undefined) {
            expect(updated.co2EmissionRate).toBeCloseTo(input.co2EmissionRate, 5);
          }
          if (input.hourlyLaborCost !== undefined) {
            expect(updated.hourlyLaborCost).toBeCloseTo(input.hourlyLaborCost, 5);
          }
          if (input.fixedCostPerDelivery !== undefined) {
            expect(updated.fixedCostPerDelivery).toBeCloseTo(
              input.fixedCostPerDelivery,
              5
            );
          }

          // Query again to verify persistence
          const queried = await repository.findById(testVehicleId);
          expect(queried).not.toBeNull();

          if (input.fuelConsumptionRate !== undefined) {
            expect(queried!.fuelConsumptionRate).toBeCloseTo(
              input.fuelConsumptionRate,
              5
            );
          }
          if (input.co2EmissionRate !== undefined) {
            expect(queried!.co2EmissionRate).toBeCloseTo(input.co2EmissionRate, 5);
          }
          if (input.hourlyLaborCost !== undefined) {
            expect(queried!.hourlyLaborCost).toBeCloseTo(input.hourlyLaborCost, 5);
          }
          if (input.fixedCostPerDelivery !== undefined) {
            expect(queried!.fixedCostPerDelivery).toBeCloseTo(
              input.fixedCostPerDelivery,
              5
            );
          }
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('CRUD operations', () => {
    it('finds vehicle by ID', async () => {
      const vehicle = await repository.findById(testVehicleId);
      expect(vehicle).not.toBeNull();
      expect(vehicle!.id).toBe(testVehicleId);
      expect(vehicle!.name).toBe('Test Van');
    });

    it('finds all vehicles', async () => {
      const vehicles = await repository.findAll();
      expect(vehicles.length).toBeGreaterThan(0);
      expect(vehicles.some((v) => v.id === testVehicleId)).toBe(true);
    });

    it('checks if vehicle exists', async () => {
      const exists = await repository.exists(testVehicleId);
      expect(exists).toBe(true);

      const notExists = await repository.exists('non-existent-id');
      expect(notExists).toBe(false);
    });
  });
});
