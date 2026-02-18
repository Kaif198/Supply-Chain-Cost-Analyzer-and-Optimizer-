import { Coordinates, BearingResult } from '../types/coordinates';

/**
 * DistanceCalculationService
 * 
 * Provides geographic distance calculations and route analysis for the supply chain platform.
 * Implements Haversine formula with road factor adjustment and alpine route detection.
 * 
 * Requirements: 1.2, 15.1, 15.2, 15.3, 15.6, 15.7
 */
export class DistanceCalculationService {
  // Earth's radius in kilometers
  private static readonly EARTH_RADIUS_KM = 6371;
  
  // Road factor to convert great-circle distance to approximate road distance
  private static readonly ROAD_FACTOR = 1.20;
  
  // Elevation threshold for alpine route classification (meters)
  private static readonly ALPINE_ELEVATION_THRESHOLD = 800;
  
  // Coordinate validation ranges
  private static readonly LAT_MIN = -90;
  private static readonly LAT_MAX = 90;
  private static readonly LON_MIN = -180;
  private static readonly LON_MAX = 180;

  /**
   * Calculate distance between two coordinates using Haversine formula with road factor
   * 
   * @param from - Origin coordinates
   * @param to - Destination coordinates
   * @returns Distance in kilometers (Haversine * 1.20)
   * @throws Error if coordinates are invalid
   */
  calculateDistance(from: Coordinates, to: Coordinates): number {
    this.validateCoordinates(from);
    this.validateCoordinates(to);

    const haversineDistance = this.haversineDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );

    // Apply 20% road factor to approximate actual road distance
    return haversineDistance * DistanceCalculationService.ROAD_FACTOR;
  }

  /**
   * Calculate great-circle distance using Haversine formula
   * 
   * @param lat1 - Origin latitude in degrees
   * @param lon1 - Origin longitude in degrees
   * @param lat2 - Destination latitude in degrees
   * @param lon2 - Destination longitude in degrees
   * @returns Distance in kilometers
   */
  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Convert degrees to radians
    const lat1Rad = this.degreesToRadians(lat1);
    const lon1Rad = this.degreesToRadians(lon1);
    const lat2Rad = this.degreesToRadians(lat2);
    const lon2Rad = this.degreesToRadians(lon2);

    // Calculate differences
    const dLat = lat2Rad - lat1Rad;
    const dLon = lon2Rad - lon1Rad;

    // Haversine formula
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distance in kilometers
    return DistanceCalculationService.EARTH_RADIUS_KM * c;
  }

  /**
   * Determine if a route is alpine based on elevation
   * 
   * @param from - Origin coordinates with elevation
   * @param to - Destination coordinates with elevation
   * @returns True if both elevations exceed 800m threshold
   */
  isAlpineRoute(from: Coordinates, to: Coordinates): boolean {
    const fromElevation = from.elevation ?? 0;
    const toElevation = to.elevation ?? 0;

    return (
      fromElevation > DistanceCalculationService.ALPINE_ELEVATION_THRESHOLD &&
      toElevation > DistanceCalculationService.ALPINE_ELEVATION_THRESHOLD
    );
  }

  /**
   * Calculate bearing (direction) from one coordinate to another
   * 
   * @param from - Origin coordinates
   * @param to - Destination coordinates
   * @returns Bearing in degrees (0-360) and cardinal direction
   * @throws Error if coordinates are invalid
   */
  calculateBearing(from: Coordinates, to: Coordinates): BearingResult {
    this.validateCoordinates(from);
    this.validateCoordinates(to);

    const lat1Rad = this.degreesToRadians(from.latitude);
    const lat2Rad = this.degreesToRadians(to.latitude);
    const dLon = this.degreesToRadians(to.longitude - from.longitude);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = this.radiansToDegrees(Math.atan2(y, x));

    // Normalize to 0-360 range
    bearing = (bearing + 360) % 360;

    return {
      bearing,
      direction: this.bearingToDirection(bearing),
    };
  }

  /**
   * Validate coordinate ranges
   * 
   * @param coords - Coordinates to validate
   * @throws Error if latitude or longitude is out of valid range
   */
  validateCoordinates(coords: Coordinates): void {
    if (
      coords.latitude < DistanceCalculationService.LAT_MIN ||
      coords.latitude > DistanceCalculationService.LAT_MAX
    ) {
      throw new Error(
        `Invalid latitude: ${coords.latitude}. Must be between ${DistanceCalculationService.LAT_MIN} and ${DistanceCalculationService.LAT_MAX}`
      );
    }

    if (
      coords.longitude < DistanceCalculationService.LON_MIN ||
      coords.longitude > DistanceCalculationService.LON_MAX
    ) {
      throw new Error(
        `Invalid longitude: ${coords.longitude}. Must be between ${DistanceCalculationService.LON_MIN} and ${DistanceCalculationService.LON_MAX}`
      );
    }
  }

  /**
   * Convert degrees to radians
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  private radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * Convert bearing to cardinal direction
   */
  private bearingToDirection(bearing: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }
}
