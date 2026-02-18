import { Coordinates } from '../types/coordinates';

/**
 * GoogleMapsService
 * 
 * Placeholder service for Google Maps integration.
 * Currently not used - the app uses Haversine distance calculations.
 * To enable: Install @googlemaps/google-maps-services-js and add GOOGLE_MAPS_API_KEY to .env
 */
export class GoogleMapsService {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = false; // Disabled - Google Maps not installed

    console.warn('[GoogleMaps] Service disabled. Using Haversine distance calculations.');
  }

  /**
   * Calculate real driving distance between two points using Google Maps Directions API
   * 
   * @param from - Origin coordinates
   * @param to - Destination coordinates
   * @returns Distance in kilometers and duration in hours
   */
  async calculateRoute(
    from: Coordinates,
    to: Coordinates
  ): Promise<{ distance: number; duration: number; polyline?: string }> {
    // Always use Haversine fallback since Google Maps is not installed
    return this.haversineFallback(from, to);
  }

  /**
   * Calculate routes for multiple waypoints (optimized route)
   * 
   * @param waypoints - Array of coordinates to visit
   * @param optimize - Whether to optimize waypoint order
   * @returns Route with total distance, duration, and optimized order
   */
  async calculateMultiWaypointRoute(
    waypoints: Coordinates[],
    _optimize: boolean = false
  ): Promise<{
    distance: number;
    duration: number;
    waypointOrder?: number[];
    polyline?: string;
  }> {
    // Always use Haversine fallback since Google Maps is not installed
    return this.multiWaypointFallback(waypoints);
  }

  /**
   * Haversine fallback calculation
   */
  private haversineFallback(
    from: Coordinates,
    to: Coordinates
  ): { distance: number; duration: number } {
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(from.latitude)) *
        Math.cos(this.toRadians(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1.2; // Apply 20% road factor

    const duration = distance / 60; // Assume 60 km/h average

    return { distance, duration };
  }

  /**
   * Multi-waypoint fallback
   */
  private multiWaypointFallback(waypoints: Coordinates[]): {
    distance: number;
    duration: number;
  } {
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const { distance, duration } = this.haversineFallback(
        waypoints[i],
        waypoints[i + 1]
      );
      totalDistance += distance;
      totalDuration += duration;
    }

    return { distance: totalDistance, duration: totalDuration };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if Google Maps API is enabled
   */
  isGoogleMapsEnabled(): boolean {
    return this.isEnabled;
  }
}
