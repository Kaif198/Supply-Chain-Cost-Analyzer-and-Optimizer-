import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { DistanceCalculationService } from './DistanceCalculationService';
import { Coordinates } from '../types/coordinates';

describe('DistanceCalculationService', () => {
  const service = new DistanceCalculationService();

  describe('haversineDistance', () => {
    it('calculates distance between Vienna and Salzburg', () => {
      // Vienna: 48.2082°N, 16.3738°E
      // Salzburg: 47.8095°N, 13.0550°E
      const distance = service.haversineDistance(48.2082, 16.3738, 47.8095, 13.055);

      // Expected distance is approximately 251 km
      expect(distance).toBeCloseTo(251, 0);
    });

    it('returns 0 for same coordinates', () => {
      const distance = service.haversineDistance(48.2082, 16.3738, 48.2082, 16.3738);
      expect(distance).toBe(0);
    });

    it('calculates distance between Innsbruck and Graz', () => {
      // Innsbruck: 47.2692°N, 11.4041°E
      // Graz: 47.0707°N, 15.4395°E
      const distance = service.haversineDistance(47.2692, 11.4041, 47.0707, 15.4395);

      // Expected distance is approximately 306 km
      expect(distance).toBeCloseTo(306, 0);
    });
  });

  describe('calculateDistance', () => {
    it('applies 20% road factor to Haversine distance', () => {
      const from: Coordinates = { latitude: 48.2082, longitude: 16.3738 };
      const to: Coordinates = { latitude: 47.8095, longitude: 13.055 };

      const haversine = service.haversineDistance(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude
      );
      const roadDistance = service.calculateDistance(from, to);

      expect(roadDistance).toBeCloseTo(haversine * 1.2, 2);
    });

    it('throws error for invalid latitude', () => {
      const from: Coordinates = { latitude: 91, longitude: 16.3738 };
      const to: Coordinates = { latitude: 47.8095, longitude: 13.055 };

      expect(() => service.calculateDistance(from, to)).toThrow('Invalid latitude');
    });

    it('throws error for invalid longitude', () => {
      const from: Coordinates = { latitude: 48.2082, longitude: 181 };
      const to: Coordinates = { latitude: 47.8095, longitude: 13.055 };

      expect(() => service.calculateDistance(from, to)).toThrow('Invalid longitude');
    });
  });

  describe('isAlpineRoute', () => {
    it('returns true when both elevations exceed 800m', () => {
      const from: Coordinates = { latitude: 47.0, longitude: 11.0, elevation: 850 };
      const to: Coordinates = { latitude: 47.1, longitude: 11.1, elevation: 900 };

      expect(service.isAlpineRoute(from, to)).toBe(true);
    });

    it('returns false when origin elevation is below 800m', () => {
      const from: Coordinates = { latitude: 47.0, longitude: 11.0, elevation: 750 };
      const to: Coordinates = { latitude: 47.1, longitude: 11.1, elevation: 900 };

      expect(service.isAlpineRoute(from, to)).toBe(false);
    });

    it('returns false when destination elevation is below 800m', () => {
      const from: Coordinates = { latitude: 47.0, longitude: 11.0, elevation: 850 };
      const to: Coordinates = { latitude: 47.1, longitude: 11.1, elevation: 750 };

      expect(service.isAlpineRoute(from, to)).toBe(false);
    });

    it('returns false when both elevations are below 800m', () => {
      const from: Coordinates = { latitude: 47.0, longitude: 11.0, elevation: 500 };
      const to: Coordinates = { latitude: 47.1, longitude: 11.1, elevation: 600 };

      expect(service.isAlpineRoute(from, to)).toBe(false);
    });

    it('returns false when elevation is not provided (defaults to 0)', () => {
      const from: Coordinates = { latitude: 47.0, longitude: 11.0 };
      const to: Coordinates = { latitude: 47.1, longitude: 11.1 };

      expect(service.isAlpineRoute(from, to)).toBe(false);
    });

    it('returns false when elevation is exactly 800m', () => {
      const from: Coordinates = { latitude: 47.0, longitude: 11.0, elevation: 800 };
      const to: Coordinates = { latitude: 47.1, longitude: 11.1, elevation: 800 };

      expect(service.isAlpineRoute(from, to)).toBe(false);
    });
  });

  describe('calculateBearing', () => {
    it('calculates bearing from Vienna to Salzburg (west)', () => {
      const from: Coordinates = { latitude: 48.2082, longitude: 16.3738 };
      const to: Coordinates = { latitude: 47.8095, longitude: 13.055 };

      const result = service.calculateBearing(from, to);

      // Salzburg is west-southwest of Vienna
      expect(result.bearing).toBeGreaterThan(240);
      expect(result.bearing).toBeLessThan(270);
      expect(result.direction).toBe('W');
    });

    it('calculates bearing from Salzburg to Vienna (east)', () => {
      const from: Coordinates = { latitude: 47.8095, longitude: 13.055 };
      const to: Coordinates = { latitude: 48.2082, longitude: 16.3738 };

      const result = service.calculateBearing(from, to);

      // Vienna is east-northeast of Salzburg
      expect(result.bearing).toBeGreaterThan(60);
      expect(result.bearing).toBeLessThan(90);
      expect(result.direction).toBe('E');
    });

    it('calculates bearing for north direction', () => {
      const from: Coordinates = { latitude: 47.0, longitude: 13.0 };
      const to: Coordinates = { latitude: 48.0, longitude: 13.0 };

      const result = service.calculateBearing(from, to);

      expect(result.bearing).toBeCloseTo(0, 0);
      expect(result.direction).toBe('N');
    });

    it('calculates bearing for south direction', () => {
      const from: Coordinates = { latitude: 48.0, longitude: 13.0 };
      const to: Coordinates = { latitude: 47.0, longitude: 13.0 };

      const result = service.calculateBearing(from, to);

      expect(result.bearing).toBeCloseTo(180, 0);
      expect(result.direction).toBe('S');
    });

    it('throws error for invalid coordinates', () => {
      const from: Coordinates = { latitude: 91, longitude: 13.0 };
      const to: Coordinates = { latitude: 47.0, longitude: 13.0 };

      expect(() => service.calculateBearing(from, to)).toThrow('Invalid latitude');
    });
  });

  describe('validateCoordinates', () => {
    it('accepts valid coordinates', () => {
      const coords: Coordinates = { latitude: 47.8095, longitude: 13.055 };
      expect(() => service.validateCoordinates(coords)).not.toThrow();
    });

    it('accepts boundary coordinates', () => {
      const coords1: Coordinates = { latitude: -90, longitude: -180 };
      const coords2: Coordinates = { latitude: 90, longitude: 180 };

      expect(() => service.validateCoordinates(coords1)).not.toThrow();
      expect(() => service.validateCoordinates(coords2)).not.toThrow();
    });

    it('rejects latitude above 90', () => {
      const coords: Coordinates = { latitude: 90.1, longitude: 13.055 };
      expect(() => service.validateCoordinates(coords)).toThrow('Invalid latitude');
    });

    it('rejects latitude below -90', () => {
      const coords: Coordinates = { latitude: -90.1, longitude: 13.055 };
      expect(() => service.validateCoordinates(coords)).toThrow('Invalid latitude');
    });

    it('rejects longitude above 180', () => {
      const coords: Coordinates = { latitude: 47.8095, longitude: 180.1 };
      expect(() => service.validateCoordinates(coords)).toThrow('Invalid longitude');
    });

    it('rejects longitude below -180', () => {
      const coords: Coordinates = { latitude: 47.8095, longitude: -180.1 };
      expect(() => service.validateCoordinates(coords)).toThrow('Invalid longitude');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Property 2: Road distance equals Haversine * 1.20
     * Validates: Requirements 1.2, 15.1, 15.2
     * 
     * For any two valid coordinate pairs, the calculated road distance should equal
     * the Haversine great-circle distance multiplied by 1.20 (the road factor).
     */
    it('Property 2: Road distance equals Haversine * 1.20', () => {
      // Generator for valid coordinates
      const arbitraryCoordinates = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
      });

      fc.assert(
        fc.property(
          arbitraryCoordinates,
          arbitraryCoordinates,
          (coord1, coord2) => {
            // Calculate Haversine distance
            const haversineDistance = service.haversineDistance(
              coord1.latitude,
              coord1.longitude,
              coord2.latitude,
              coord2.longitude
            );

            // Calculate road distance using the service
            const roadDistance = service.calculateDistance(coord1, coord2);

            // Property: road distance should equal Haversine * 1.20
            // Allow small floating point tolerance (0.001 km = 1 meter)
            const expectedRoadDistance = haversineDistance * 1.20;
            const tolerance = 0.001;

            expect(Math.abs(roadDistance - expectedRoadDistance)).toBeLessThan(tolerance);
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Property 23: Coordinate validation
     * Validates: Requirements 15.7
     * 
     * For any coordinate input, the system should validate that latitude is between
     * -90 and 90, and longitude is between -180 and 180.
     */
    it('Property 23: Coordinate validation', () => {
      // Generator for valid coordinates (should not throw)
      const validCoordinates = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
      });

      // Generator for invalid latitudes (outside -90 to 90 range)
      const invalidLatitude = fc.oneof(
        fc.double({ min: -1000, max: -90.01, noNaN: true }),
        fc.double({ min: 90.01, max: 1000, noNaN: true })
      );

      // Generator for invalid longitudes (outside -180 to 180 range)
      const invalidLongitude = fc.oneof(
        fc.double({ min: -1000, max: -180.01, noNaN: true }),
        fc.double({ min: 180.01, max: 1000, noNaN: true })
      );

      // Property 1: Valid coordinates should not throw
      fc.assert(
        fc.property(validCoordinates, (coords) => {
          expect(() => service.validateCoordinates(coords)).not.toThrow();
        }),
        { numRuns: 20 }
      );

      // Property 2: Invalid latitude should throw with appropriate message
      fc.assert(
        fc.property(
          invalidLatitude,
          fc.double({ min: -180, max: 180, noNaN: true }),
          (lat, lon) => {
            const coords: Coordinates = { latitude: lat, longitude: lon };
            expect(() => service.validateCoordinates(coords)).toThrow('Invalid latitude');
          }
        ),
        { numRuns: 20 }
      );

      // Property 3: Invalid longitude should throw with appropriate message
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          invalidLongitude,
          (lat, lon) => {
            const coords: Coordinates = { latitude: lat, longitude: lon };
            expect(() => service.validateCoordinates(coords)).toThrow('Invalid longitude');
          }
        ),
        { numRuns: 20 }
      );
    });

    /**
     * Property 25: Bearing calculation
     * Validates: Requirements 15.6
     * 
     * For any two coordinate pairs, the bearing should be calculated correctly
     * for route direction visualization.
     */
    it('Property 25: Bearing calculation', () => {
      // Generator for valid coordinates
      const arbitraryCoordinates = fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
      });

      fc.assert(
        fc.property(
          arbitraryCoordinates,
          arbitraryCoordinates,
          (coord1, coord2) => {
            const result = service.calculateBearing(coord1, coord2);

            // Property 1: Bearing should be in valid range [0, 360)
            expect(result.bearing).toBeGreaterThanOrEqual(0);
            expect(result.bearing).toBeLessThan(360);

            // Property 2: Direction should be one of the 8 cardinal directions
            const validDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            expect(validDirections).toContain(result.direction);

            // Property 3: Direction should match bearing range
            // N: 337.5-22.5, NE: 22.5-67.5, E: 67.5-112.5, SE: 112.5-157.5
            // S: 157.5-202.5, SW: 202.5-247.5, W: 247.5-292.5, NW: 292.5-337.5
            const bearing = result.bearing;
            const direction = result.direction;

            if ((bearing >= 337.5 || bearing < 22.5) && direction !== 'N') {
              throw new Error(`Bearing ${bearing} should map to N, got ${direction}`);
            }
            if (bearing >= 22.5 && bearing < 67.5 && direction !== 'NE') {
              throw new Error(`Bearing ${bearing} should map to NE, got ${direction}`);
            }
            if (bearing >= 67.5 && bearing < 112.5 && direction !== 'E') {
              throw new Error(`Bearing ${bearing} should map to E, got ${direction}`);
            }
            if (bearing >= 112.5 && bearing < 157.5 && direction !== 'SE') {
              throw new Error(`Bearing ${bearing} should map to SE, got ${direction}`);
            }
            if (bearing >= 157.5 && bearing < 202.5 && direction !== 'S') {
              throw new Error(`Bearing ${bearing} should map to S, got ${direction}`);
            }
            if (bearing >= 202.5 && bearing < 247.5 && direction !== 'SW') {
              throw new Error(`Bearing ${bearing} should map to SW, got ${direction}`);
            }
            if (bearing >= 247.5 && bearing < 292.5 && direction !== 'W') {
              throw new Error(`Bearing ${bearing} should map to W, got ${direction}`);
            }
            if (bearing >= 292.5 && bearing < 337.5 && direction !== 'NW') {
              throw new Error(`Bearing ${bearing} should map to NW, got ${direction}`);
            }

            // Property 4: Bearing from same coordinates should be defined
            // (implementation may vary, but should not throw)
            if (coord1.latitude === coord2.latitude && coord1.longitude === coord2.longitude) {
              expect(result.bearing).toBeGreaterThanOrEqual(0);
              expect(result.bearing).toBeLessThan(360);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});

