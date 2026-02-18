import { Coordinates } from './coordinates';
import { Vehicle } from './cost';

export type OptimizationMode = 'fastest' | 'cheapest' | 'greenest' | 'balanced';

export interface Premise {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  elevation: number;
  weeklyDemand: number;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  elevation: number;
}

export interface RouteOptimizationParams {
  premises: Premise[];
  vehicle: Vehicle;
  warehouse: Warehouse;
  mode: OptimizationMode;
  totalDemand: number;
}

export interface RouteSegment {
  from: Premise | Warehouse;
  to: Premise | Warehouse;
  distance: number;
  cost: number;
  duration: number;
  co2: number;
}

export interface OptimizedRoute {
  sequence: (Premise | Warehouse)[];
  totalDistance: number;
  totalCost: number;
  totalDuration: number;
  totalCO2: number;
  segmentDetails: RouteSegment[];
  capacityExceeded: boolean;
  suggestedVehicles?: string[];
  multiTripRequired?: boolean;
}

export interface RouteMetrics {
  distance: number;
  cost: number;
  duration: number;
  co2: number;
}
