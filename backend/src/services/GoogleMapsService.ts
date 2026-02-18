import { Client, TravelMode, DirectionsRoute } from '@googlemaps/google-maps-services-js';
import { Coordinates } from '../types/coordinates';

/**
 * GoogleMapsService
 * 
 * Provides real-world routing and distance calculations using Google Maps API.
 * Falls back to Haversine calculation if API is unavailable or not configured.
 */
export class GoogleMapsService {
  private client: Client;
  private apiKey: string | undefined;
  private isEnabled: boolean;

  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.isEnabled = !!this.apiKey;

    if (!this.isEnabled) {
      console.warn('[GoogleMaps] API key not configured. Using Haversine fallback.');
    }
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
    if (!this.isEnabled || !this.apiKey) {
      // Fallback to Haversine
      return this.haversineFallback(from, to);
    }

    try {
      const response = await this.client.directions({
        params: {
          origin: `${from.latitude},${from.longitude}`,
          destination: `${to.latitude},${to.longitude}`,
          mode: TravelMode.driving,
          key: this.apiKey,
        },
        timeout: 5000, // 5 second timeout
      });

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];

        // Distance in kilometers
        const distance = leg.distance.value / 1000;
        
        // Duration in hours
        const duration = leg.duration.value / 3600;

        // Encoded polyline for map visualization
        const polyline = route.overview_polyline.points;

        console.log(`[GoogleMaps] Route calculated: ${distance.toFixed(2)}km, ${duration.toFixed(2)}h`);

        return { distance, duration, polyline };
      } else {
        console.warn(`[GoogleMaps] API returned status: ${response.data.status}. Using fallback.`);
        return this.haversineFallback(from, to);
      }
    } catch (error) {
      console.error('[GoogleMaps] API error:', error);
      return this.haversineFallback(from, to);
    }
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
    optimize: boolean = false
  ): Promise<{
    distance: number;
    duration: number;
    waypointOrder?: number[];
    polyline?: string;
  }> {
    if (!this.isEnabled || !this.apiKey || waypoints.length < 2) {
      return this.multiWaypointFallback(waypoints);
    }

    try {
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const intermediateWaypoints = waypoints.slice(1, -1);

      const response = await this.client.directions({
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          waypoints: intermediateWaypoints.map(
            (w) => `${w.latitude},${w.longitude}`
          ),
          optimize_waypoints: optimize,
          mode: TravelMode.driving,
          key: this.apiKey,
        },
        timeout: 10000, // 10 second timeout for complex routes
      });

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        
        // Sum up all legs
        let totalDistance = 0;
        let totalDuration = 0;

        for (const leg of route.legs) {
          totalDistance += leg.distance.value / 1000; // km
          totalDuration += leg.duration.value / 3600; // hours
        }

        const polyline = route.overview_polyline.points;
        const waypointOrder = route.waypoint_order;

        console.log(`[GoogleMaps] Multi-waypoint route: ${totalDistance.toFixed(2)}km, ${totalDuration.toFixed(2)}h`);

        return {
          distance: totalDistance,
          duration: totalDuration,
          waypointOrder,
          polyline,
        };
      } else {
        console.warn(`[GoogleMaps] Multi-waypoint API returned: ${response.data.status}. Using fallback.`);
        return this.multiWaypointFallback(waypoints);
      }
    } catch (error) {
      console.error('[GoogleMaps] Multi-waypoint API error:', error);
      return this.multiWaypointFallback(waypoints);
    }
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
