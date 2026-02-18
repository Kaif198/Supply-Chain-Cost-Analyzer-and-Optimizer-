import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { CostCalculationService } from './CostCalculationService';
import { Coordinates } from '../types/coordinates';
import { Vehicle } from '../types/cost';

describe('CostCalculationService', () => {
  const costService = new CostCalculationService();

  // Arbitraries for property-based testing
  const arbitraryCoordinates = (): fc.Arbitrary<Coordinates> =>
    fc.record({
      latitude: fc.double({ min: 46.4, max: 49.0, noNaN: true }),
      longitude: fc.double({ min: 9.5, max: 17.2, noNaN: true }),
      elevation: fc.double({ min: 0, max: 3000, noNaN: true }),
    });

  const arbitraryVehicle = (): fc.Arbitrary<Vehicle> =>
    fc.constantFrom(
      {
        id: 'small-van',
        name: 'Small Van',
        type: 'small_van',
        capacity: 800,
        fuelConsumptionRate: 0.12,
        co2EmissionRate: 0.28,
        hourlyLaborCost: 25,
        fixedCostPerDelivery: 15,
      },
      {
        id: 'medium-truck',
        name: 'Medium Truck',
        type: 'medium_truck',
        capacity: 2400,
        fuelConsumptionRate: 0.18,
        co2EmissionRate: 0.42,
        hourlyLaborCost: 30,
        fixedCostPerDelivery: 25,
      },
      {
        id: 'large-truck',
        name: 'Large Truck',
        type: 'large_truck',
        capacity: 6000,
        fuelConsumptionRate: 0.25,
        co2EmissionRate: 0.58,
        hourlyLaborCost: 35,
        fixedCostPerDelivery: 40,
      }
    );

  describe('Property-Based Tests', () => {
    test('Property 1: Complete cost breakdown calculation', () => {
      fc.assert(
        fc.property(
          arbitraryCoordinates(),
          arbitraryCoordinates(),
          arbitraryVehicle(),
          fc.integer({ min: 1, max: 6000 }),
          (origin, destination, vehicle, demand) => {
            // Skip if demand exceeds capacity
            if (demand > vehicle.capacity) {
              return true;
            }

            const result = costService.calculateDeliveryCost({
              origin,
              destination,
              vehicle,
              demand,
            });

            // Verify all cost components are present and non-negative
            expect(result.fuelCost).toBeGreaterThanOrEqual(0);
            expect(result.laborCost).toBeGreaterThanOrEqual(0);
            expect(result.vehicleCost).toBeGreaterThanOrEqual(0);
            expect(result.carbonCost).toBeGreaterThanOrEqual(0);

            // Verify total cost equals sum of components (with floating point tolerance)
            const sum = result.fuelCost + result.laborCost + result.vehicleCost + result.carbonCost;
            expect(Math.abs(sum - result.totalCost)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Property 3: Alpine route fuel adjustment', () => {
      fc.assert(
        fc.property(
          arbitraryCoordinates(),
          arbitraryCoordinates(),
          arbitraryVehicle(),
          fc.integer({ min: 1, max: 6000 }),
          (origin, destination, vehicle, demand) => {
            // Skip if demand exceeds capacity
            if (demand > vehicle.capacity) {
              return true;
            }

            // Create alpine version (both elevations > 800m)
            const alpineOrigin = { ...origin, elevation: 850 };
            const alpineDestination = { ...destination, elevation: 850 };

            // Create non-alpine version (both elevations <= 800m)
            const lowOrigin = { ...origin, elevation: 500 };
            const lowDestination = { ...destination, elevation: 500 };

            const alpineResult = costService.calculateDeliveryCost({
              origin: alpineOrigin,
              destination: alpineDestination,
              vehicle,
              demand,
            });

            const lowResult = costService.calculateDeliveryCost({
              origin: lowOrigin,
              destination: lowDestination,
              vehicle,
              demand,
            });

            // Alpine route should have 15% higher fuel cost
            expect(alpineResult.isAlpine).toBe(true);
            expect(lowResult.isAlpine).toBe(false);
            expect(alpineResult.fuelCost).toBeCloseTo(lowResult.fuelCost * 1.15, 2);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Property 4: Overtime labor calculation', () => {
      fc.assert(
        fc.property(
          arbitraryVehicle(),
          fc.double({ min: 0, max: 20, noNaN: true }),
          (vehicle, duration) => {
            const laborCost = costService.calculateLaborCost(duration, vehicle);

            if (duration <= 8) {
              // No overtime: cost should equal duration * hourly rate
              expect(laborCost).toBeCloseTo(duration * vehicle.hourlyLaborCost, 2);
            } else {
              // With overtime: base 8 hours + overtime at 1.5x
              const baseCost = 8 * vehicle.hourlyLaborCost;
              const overtimeHours = duration - 8;
              const overtimeCost = overtimeHours * vehicle.hourlyLaborCost * 1.5;
              const expectedCost = baseCost + overtimeCost;
              expect(laborCost).toBeCloseTo(expectedCost, 2);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Property 5: CO2 and carbon offset calculation', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 500, noNaN: true }),
          arbitraryVehicle(),
          (distance, vehicle) => {
            const { co2Emissions, carbonCost } = costService.calculateCarbonCost(distance, vehicle);

            // CO2 emissions should equal distance * emission rate
            expect(co2Emissions).toBeCloseTo(distance * vehicle.co2EmissionRate, 2);

            // Carbon cost should equal (CO2 in tons) * €25
            const expectedCarbonCost = (co2Emissions / 1000) * 25;
            expect(carbonCost).toBeCloseTo(expectedCarbonCost, 2);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Property 6: Fuel cost constant', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 500, noNaN: true }),
          arbitraryVehicle(),
          fc.boolean(),
          (distance, vehicle, isAlpine) => {
            const fuelCost = costService.calculateFuelCost(distance, vehicle, isAlpine);

            // Calculate expected fuel consumption
            let fuelConsumption = distance * vehicle.fuelConsumptionRate;
            if (isAlpine) {
              fuelConsumption *= 1.15;
            }

            // Fuel cost should use €1.45 per liter
            const expectedCost = fuelConsumption * 1.45;
            expect(fuelCost).toBeCloseTo(expectedCost, 2);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Property 7: Capacity constraint detection', () => {
      fc.assert(
        fc.property(
          arbitraryCoordinates(),
          arbitraryCoordinates(),
          arbitraryVehicle(),
          (origin, destination, vehicle) => {
            // Demand exceeding capacity should throw error
            const excessDemand = vehicle.capacity + 1;

            expect(() => {
              costService.calculateDeliveryCost({
                origin,
                destination,
                vehicle,
                demand: excessDemand,
              });
            }).toThrow(/capacity constraint violation/i);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Property 8: Fixed vehicle cost inclusion', () => {
      fc.assert(
        fc.property(
          arbitraryCoordinates(),
          arbitraryCoordinates(),
          arbitraryVehicle(),
          fc.integer({ min: 1, max: 6000 }),
          (origin, destination, vehicle, demand) => {
            // Skip if demand exceeds capacity
            if (demand > vehicle.capacity) {
              return true;
            }

            const result = costService.calculateDeliveryCost({
              origin,
              destination,
              vehicle,
              demand,
            });

            // Vehicle cost should equal fixed cost per delivery
            expect(result.vehicleCost).toBe(vehicle.fixedCostPerDelivery);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('Property 9: Vehicle-specific labor rates', () => {
      fc.assert(
        fc.property(
          arbitraryCoordinates(),
          arbitraryCoordinates(),
          fc.integer({ min: 1, max: 800 }),
          (origin, destination, demand) => {
            // Test with different vehicles
            const smallVan = {
              id: 'small-van',
              name: 'Small Van',
              type: 'small_van',
              capacity: 800,
              fuelConsumptionRate: 0.12,
              co2EmissionRate: 0.28,
              hourlyLaborCost: 25,
              fixedCostPerDelivery: 15,
            };

            const mediumTruck = {
              id: 'medium-truck',
              name: 'Medium Truck',
              type: 'medium_truck',
              capacity: 2400,
              fuelConsumptionRate: 0.18,
              co2EmissionRate: 0.42,
              hourlyLaborCost: 30,
              fixedCostPerDelivery: 25,
            };

            const resultSmall = costService.calculateDeliveryCost({
              origin,
              destination,
              vehicle: smallVan,
              demand,
            });

            const resultMedium = costService.calculateDeliveryCost({
              origin,
              destination,
              vehicle: mediumTruck,
              demand,
            });

            // Labor costs should differ based on vehicle-specific rates
            // Since distance and duration are the same, the ratio should match the hourly rate ratio
            const rateRatio = mediumTruck.hourlyLaborCost / smallVan.hourlyLaborCost;
            expect(resultMedium.laborCost).toBeCloseTo(resultSmall.laborCost * rateRatio, 2);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});

