import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { PremiseRepository, PremiseInput } from './PremiseRepository';
import prisma from '../utils/prisma';

describe('PremiseRepository', () => {
  const repository = new PremiseRepository();

  // Clean up test data after each test
  afterEach(async () => {
    await prisma.delivery.deleteMany({});
    await prisma.premise.deleteMany({});
  });

  // Arbitrary generators for property-based testing
  const arbitraryAustrianCoordinates = () =>
    fc.record({
      latitude: fc.double({ min: 46.4, max: 49.0 }),
      longitude: fc.double({ min: 9.5, max: 17.2 }),
      elevation: fc.double({ min: 0, max: 3000 }),
    });

  const arbitraryPremiseCategory = () =>
    fc.constantFrom('nightclub', 'gym', 'retail', 'restaurant', 'hotel');

  const arbitraryPremiseInput = (): fc.Arbitrary<PremiseInput> =>
    fc.record({
      name: fc.string({ minLength: 3, maxLength: 50 }),
      category: arbitraryPremiseCategory(),
      address: fc.string({ minLength: 10, maxLength: 100 }),
      latitude: fc.double({ min: 46.4, max: 49.0 }),
      longitude: fc.double({ min: 9.5, max: 17.2 }),
      elevation: fc.double({ min: 0, max: 3000 }),
      weeklyDemand: fc.integer({ min: 1, max: 5000 }),
    });

  describe('Property 32: Premise creation completeness', () => {
    /**
     * **Validates: Requirements 5.1**
     * For any valid premise input, the created premise should have all required fields:
     * name, category, address, coordinates, and weekly demand.
     */
    it('creates premise with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryPremiseInput(), async (input) => {
          const created = await repository.create(input);

          // Verify all required fields are present
          expect(created.id).toBeDefined();
          expect(created.name).toBe(input.name);
          expect(created.category).toBe(input.category);
          expect(created.address).toBe(input.address);
          expect(created.latitude).toBeCloseTo(input.latitude, 5);
          expect(created.longitude).toBeCloseTo(input.longitude, 5);
          expect(created.elevation).toBeCloseTo(input.elevation ?? 0, 5);
          expect(created.weeklyDemand).toBe(input.weeklyDemand);
          expect(created.createdAt).toBeInstanceOf(Date);
          expect(created.updatedAt).toBeInstanceOf(Date);

          // Clean up
          await repository.delete(created.id);
        }),
        { numRuns: 20 } // Reduced runs for database operations
      );
    });
  });

  describe('Property 24: Austrian boundary validation', () => {
    /**
     * **Validates: Requirements 5.2**
     * For any premise creation, coordinates should be validated to be within
     * Austrian boundaries (46.4°-49.0°N, 9.5°-17.2°E).
     */
    it('rejects coordinates outside Austrian boundaries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 50 }),
            category: arbitraryPremiseCategory(),
            address: fc.string({ minLength: 10, maxLength: 100 }),
            latitude: fc.double({ min: -90, max: 90 }).filter((lat) => lat < 46.4 || lat > 49.0),
            longitude: fc.double({ min: -180, max: 180 }),
            weeklyDemand: fc.integer({ min: 1, max: 5000 }),
          }),
          async (input) => {
            await expect(repository.create(input)).rejects.toThrow(
              /Austrian boundaries/
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it('accepts coordinates within Austrian boundaries', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryPremiseInput(), async (input) => {
          const created = await repository.create(input);
          expect(created.latitude).toBeGreaterThanOrEqual(46.4);
          expect(created.latitude).toBeLessThanOrEqual(49.0);
          expect(created.longitude).toBeGreaterThanOrEqual(9.5);
          expect(created.longitude).toBeLessThanOrEqual(17.2);

          // Clean up
          await repository.delete(created.id);
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 33: Premise filtering by category', () => {
    /**
     * **Validates: Requirements 5.3**
     * For any category filter, returned premises should only include
     * those matching the specified category.
     */
    it('filters premises by category correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(arbitraryPremiseInput(), { minLength: 5, maxLength: 10 }),
          arbitraryPremiseCategory(),
          async (inputs, filterCategory) => {
            // Create test premises
            const created = await Promise.all(inputs.map((input) => repository.create(input)));

            // Filter by category
            const filtered = await repository.findAll({ category: filterCategory });

            // All returned premises should match the filter category
            filtered.forEach((premise) => {
              expect(premise.category).toBe(filterCategory);
            });

            // Clean up
            await Promise.all(created.map((p) => repository.delete(p.id)));
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 34: Premise update persistence', () => {
    /**
     * **Validates: Requirements 5.5**
     * For any premise update, querying the premise after update should
     * return the updated values.
     */
    it('persists premise updates correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryPremiseInput(),
          arbitraryPremiseInput(),
          async (initialInput, updateInput) => {
            // Create initial premise
            const created = await repository.create(initialInput);

            // Update premise
            const updated = await repository.update(created.id, {
              name: updateInput.name,
              weeklyDemand: updateInput.weeklyDemand,
            });

            // Verify updates persisted
            expect(updated.name).toBe(updateInput.name);
            expect(updated.weeklyDemand).toBe(updateInput.weeklyDemand);

            // Query again to verify persistence
            const queried = await repository.findById(created.id);
            expect(queried).not.toBeNull();
            expect(queried!.name).toBe(updateInput.name);
            expect(queried!.weeklyDemand).toBe(updateInput.weeklyDemand);

            // Clean up
            await repository.delete(created.id);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 35: Conditional premise deletion', () => {
    /**
     * **Validates: Requirements 5.6, 5.7**
     * For any premise with no associated deliveries, deletion should succeed
     * and the premise should not appear in subsequent queries.
     */
    it('deletes premise without deliveries successfully', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryPremiseInput(), async (input) => {
          // Create premise
          const created = await repository.create(input);

          // Delete premise (no deliveries)
          await repository.delete(created.id);

          // Verify premise no longer exists
          const queried = await repository.findById(created.id);
          expect(queried).toBeNull();

          const exists = await repository.exists(created.id);
          expect(exists).toBe(false);
        }),
        { numRuns: 20 }
      );
    });

    it('prevents deletion of premise with deliveries', async () => {
      // This test requires a delivery to exist, which needs vehicle and warehouse
      // We'll create a simple unit test for this
      const premise1 = await repository.create({
        name: 'Test Premise 1',
        category: 'nightclub',
        address: 'Test Address 1',
        latitude: 48.2082,
        longitude: 16.3738,
        weeklyDemand: 100,
      });

      const premise2 = await repository.create({
        name: 'Test Premise 2',
        category: 'gym',
        address: 'Test Address 2',
        latitude: 47.8095,
        longitude: 13.055,
        weeklyDemand: 150,
      });

      // Create a vehicle for the delivery
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

      // Create a delivery associated with premise1
      await prisma.delivery.create({
        data: {
          originId: premise1.id,
          destinationId: premise2.id,
          vehicleId: vehicle.id,
          demand: 100,
          distance: 100,
          duration: 2,
          fuelCost: 50,
          laborCost: 50,
          vehicleCost: 15,
          carbonCost: 10,
          totalCost: 125,
          co2Emissions: 28,
          isAlpine: false,
          hasOvertime: false,
          deliveryDate: new Date(),
        },
      });

      // Attempt to delete premise with delivery should fail
      await expect(repository.delete(premise1.id)).rejects.toThrow(/associated deliveries/);

      // Clean up
      await prisma.delivery.deleteMany({});
      await repository.delete(premise1.id);
      await repository.delete(premise2.id);
      await prisma.vehicle.delete({ where: { id: vehicle.id } });
    });
  });

  describe('Property 36: Demand validation', () => {
    /**
     * **Validates: Requirements 5.8**
     * For any premise input, weekly demand should be rejected if it is not
     * a positive integer.
     */
    it('rejects non-positive weekly demand', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryPremiseInput(),
          fc.integer({ min: -1000, max: 0 }),
          async (input, invalidDemand) => {
            const invalidInput = { ...input, weeklyDemand: invalidDemand };
            await expect(repository.create(invalidInput)).rejects.toThrow(
              /positive integer/
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it('rejects non-integer weekly demand', async () => {
      const input = await fc.sample(arbitraryPremiseInput(), 1)[0];
      const invalidInput = { ...input, weeklyDemand: 100.5 as any };

      await expect(repository.create(invalidInput)).rejects.toThrow(/positive integer/);
    });

    it('accepts positive integer weekly demand', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryPremiseInput(), async (input) => {
          const created = await repository.create(input);
          expect(created.weeklyDemand).toBeGreaterThan(0);
          expect(Number.isInteger(created.weeklyDemand)).toBe(true);

          // Clean up
          await repository.delete(created.id);
        }),
        { numRuns: 20 }
      );
    });
  });
});
