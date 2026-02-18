import { CostCalculationService } from './CostCalculationService';
import { DistanceCalculationService } from './DistanceCalculationService';
import {
  RouteOptimizationParams,
  OptimizedRoute,
  RouteSegment,
  Premise,
  Warehouse,
  OptimizationMode,
  RouteMetrics,
} from '../types/route';
import { Coordinates } from '../types/coordinates';

/**
 * RouteOptimizationService
 * 
 * Optimizes multi-stop delivery routes using nearest neighbor algorithm.
 * Supports multiple optimization modes: fastest, cheapest, greenest, balanced.
 * Handles capacity constraints and provides multi-trip suggestions.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
 */
export class RouteOptimizationService {
  private costService: CostCalculationService;
  private distanceService: DistanceCalculationService;

  // Average speed for duration calculations
  private static readonly AVERAGE_SPEED_KMH = 60;

  // Balanced mode weights (must sum to 1.0)
  private static readonly BALANCED_WEIGHTS = {
    time: 0.33,
    cost: 0.33,
    co2: 0.34,
  };

  constructor() {
    this.costService = new CostCalculationService();
    this.distanceService = new DistanceCalculationService();
  }

  /**
   * Optimize a multi-stop delivery route
   * 
   * @param params - Route optimization parameters
   * @returns Optimized route with sequence and metrics
   */
  optimizeRoute(params: RouteOptimizationParams): OptimizedRoute {
    const { premises, vehicle, warehouse, mode, totalDemand } = params;

    // Check capacity constraints
    const capacityExceeded = totalDemand > vehicle.capacity;
    const suggestedVehicles: string[] = [];
    const multiTripRequired = capacityExceeded;

    if (capacityExceeded) {
      // Suggest larger vehicles or multi-trip
      if (vehicle.type === 'small_van') {
        suggestedVehicles.push('medium_truck', 'large_truck');
      } else if (vehicle.type === 'medium_truck') {
        suggestedVehicles.push('large_truck');
      } else {
        // Even large truck can't handle it - need multiple trips
        const tripsNeeded = Math.ceil(totalDemand / vehicle.capacity);
        suggestedVehicles.push(`${tripsNeeded} trips with ${vehicle.type}`);
      }
    }

    // Use nearest neighbor algorithm to find optimal sequence
    const sequence = this.nearestNeighbor(premises, warehouse, mode, vehicle);

    // Calculate route metrics and segment details
    const { segmentDetails, metrics } = this.calculateRouteMetrics(sequence, vehicle);

    return {
      sequence,
      totalDistance: metrics.distance,
      totalCost: metrics.cost,
      totalDuration: metrics.duration,
      totalCO2: metrics.co2,
      segmentDetails,
      capacityExceeded,
      suggestedVehicles: suggestedVehicles.length > 0 ? suggestedVehicles : undefined,
      multiTripRequired: multiTripRequired ? true : undefined,
    };
  }

  /**
   * Nearest neighbor algorithm for route sequencing
   * 
   * @param premises - List of premises to visit
   * @param warehouse - Starting/ending warehouse
   * @param mode - Optimization mode
   * @param vehicle - Vehicle for cost calculations
   * @returns Optimized sequence including warehouse at start and end
   */
  nearestNeighbor(
    premises: Premise[],
    warehouse: Warehouse,
    mode: OptimizationMode,
    vehicle: any
  ): (Premise | Warehouse)[] {
    if (premises.length === 0) {
      return [warehouse, warehouse];
    }

    const unvisited = new Set(premises.map((p) => p.id));
    const sequence: (Premise | Warehouse)[] = [warehouse];
    let currentLocation: Premise | Warehouse = warehouse;

    // Visit all premises using nearest neighbor
    while (unvisited.size > 0) {
      let bestPremise: Premise | null = null;
      let bestMetric = Infinity;

      // Find the best next premise based on optimization mode
      for (const premise of premises) {
        if (!unvisited.has(premise.id)) continue;

        const metric = this.calculateMetric(currentLocation, premise, mode, vehicle);

        if (metric < bestMetric) {
          bestMetric = metric;
          bestPremise = premise;
        }
      }

      if (bestPremise) {
        sequence.push(bestPremise);
        unvisited.delete(bestPremise.id);
        currentLocation = bestPremise;
      }
    }

    // Return to warehouse
    sequence.push(warehouse);

    return sequence;
  }

  /**
   * Calculate optimization metric for a segment based on mode
   * 
   * @param from - Origin location
   * @param to - Destination location
   * @param mode - Optimization mode
   * @param vehicle - Vehicle for calculations
   * @returns Metric value (lower is better)
   */
  private calculateMetric(
    from: Premise | Warehouse,
    to: Premise | Warehouse,
    mode: OptimizationMode,
    vehicle: any
  ): number {
    const fromCoords: Coordinates = {
      latitude: from.latitude,
      longitude: from.longitude,
      elevation: from.elevation,
    };

    const toCoords: Coordinates = {
      latitude: to.latitude,
      longitude: to.longitude,
      elevation: to.elevation,
    };

    const distance = this.distanceService.calculateDistance(fromCoords, toCoords);
    const duration = distance / RouteOptimizationService.AVERAGE_SPEED_KMH;

    let metric: number;

    switch (mode) {
      case 'fastest':
        metric = duration;
        console.log(`[RouteOptimization] Mode: ${mode}, From: ${from.name}, To: ${to.name}, Metric (duration): ${metric.toFixed(2)} hours`);
        return metric;

      case 'cheapest': {
        // Calculate cost for this segment
        const isAlpine = this.distanceService.isAlpineRoute(fromCoords, toCoords);
        const fuelCost = this.costService.calculateFuelCost(distance, vehicle, isAlpine);
        const laborCost = this.costService.calculateLaborCost(duration, vehicle);
        const vehicleCost = this.costService.calculateVehicleCost(vehicle);
        const { carbonCost } = this.costService.calculateCarbonCost(distance, vehicle);
        metric = fuelCost + laborCost + vehicleCost + carbonCost;
        console.log(`[RouteOptimization] Mode: ${mode}, From: ${from.name}, To: ${to.name}, Metric (cost): €${metric.toFixed(2)}`);
        return metric;
      }

      case 'greenest': {
        // Calculate CO2 emissions
        metric = distance * vehicle.co2EmissionRate;
        console.log(`[RouteOptimization] Mode: ${mode}, From: ${from.name}, To: ${to.name}, Metric (CO2): ${metric.toFixed(2)} kg`);
        return metric;
      }

      case 'balanced': {
        // Calculate all three metrics and normalize
        const isAlpine = this.distanceService.isAlpineRoute(fromCoords, toCoords);
        const fuelCost = this.costService.calculateFuelCost(distance, vehicle, isAlpine);
        const laborCost = this.costService.calculateLaborCost(duration, vehicle);
        const vehicleCost = this.costService.calculateVehicleCost(vehicle);
        const { carbonCost } = this.costService.calculateCarbonCost(distance, vehicle);
        const cost = fuelCost + laborCost + vehicleCost + carbonCost;
        const co2 = distance * vehicle.co2EmissionRate;

        // Weighted combination (normalized by typical values)
        const normalizedTime = duration / 10; // Typical max ~10 hours
        const normalizedCost = cost / 500; // Typical max ~€500
        const normalizedCO2 = co2 / 100; // Typical max ~100 kg

        metric = (
          RouteOptimizationService.BALANCED_WEIGHTS.time * normalizedTime +
          RouteOptimizationService.BALANCED_WEIGHTS.cost * normalizedCost +
          RouteOptimizationService.BALANCED_WEIGHTS.co2 * normalizedCO2
        );
        console.log(`[RouteOptimization] Mode: ${mode}, From: ${from.name}, To: ${to.name}, Metric (balanced): ${metric.toFixed(4)} (time: ${normalizedTime.toFixed(2)}, cost: ${normalizedCost.toFixed(2)}, CO2: ${normalizedCO2.toFixed(2)})`);
        return metric;
      }

      default:
        throw new Error(`Unknown optimization mode: ${mode}`);
    }
  }

  /**
   * Calculate complete route metrics and segment details
   * 
   * @param sequence - Route sequence
   * @param vehicle - Vehicle for calculations
   * @param warehouse - Warehouse location
   * @returns Segment details and total metrics
   */
  calculateRouteMetrics(
    sequence: (Premise | Warehouse)[],
    vehicle: any
  ): { segmentDetails: RouteSegment[]; metrics: RouteMetrics } {
    const segmentDetails: RouteSegment[] = [];
    let totalDistance = 0;
    let totalCost = 0;
    let totalDuration = 0;
    let totalCO2 = 0;

    // Calculate metrics for each segment
    for (let i = 0; i < sequence.length - 1; i++) {
      const from = sequence[i];
      const to = sequence[i + 1];

      const fromCoords: Coordinates = {
        latitude: from.latitude,
        longitude: from.longitude,
        elevation: from.elevation,
      };

      const toCoords: Coordinates = {
        latitude: to.latitude,
        longitude: to.longitude,
        elevation: to.elevation,
      };

      // Calculate segment metrics
      const distance = this.distanceService.calculateDistance(fromCoords, toCoords);
      const duration = distance / RouteOptimizationService.AVERAGE_SPEED_KMH;
      const isAlpine = this.distanceService.isAlpineRoute(fromCoords, toCoords);

      const fuelCost = this.costService.calculateFuelCost(distance, vehicle, isAlpine);
      const laborCost = this.costService.calculateLaborCost(duration, vehicle);
      const vehicleCost = this.costService.calculateVehicleCost(vehicle);
      const { co2Emissions, carbonCost } = this.costService.calculateCarbonCost(distance, vehicle);

      const segmentCost = fuelCost + laborCost + vehicleCost + carbonCost;

      segmentDetails.push({
        from,
        to,
        distance,
        cost: segmentCost,
        duration,
        co2: co2Emissions,
      });

      totalDistance += distance;
      totalCost += segmentCost;
      totalDuration += duration;
      totalCO2 += co2Emissions;
    }

    return {
      segmentDetails,
      metrics: {
        distance: totalDistance,
        cost: totalCost,
        duration: totalDuration,
        co2: totalCO2,
      },
    };
  }
}
