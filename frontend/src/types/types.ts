// === Entity Types ===

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface Premise {
  id: string;
  name: string;
  category: 'nightclub' | 'gym' | 'retail' | 'restaurant' | 'hotel';
  address: string;
  latitude: number;
  longitude: number;
  elevation: number;
  weeklyDemand: number;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'small_van' | 'medium_truck' | 'large_truck';
  capacity: number;
  fuelConsumptionRate: number;
  co2EmissionRate: number;
  hourlyLaborCost: number;
  fixedCostPerDelivery: number;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  elevation: number;
}

export interface Delivery {
  id: string;
  originId: string;
  destinationId: string;
  vehicleId: string;
  demand: number;
  distance: number;
  duration: number;
  fuelCost: number;
  laborCost: number;
  vehicleCost: number;
  carbonCost: number;
  totalCost: number;
  co2Emissions: number;
  isAlpine: boolean;
  hasOvertime: boolean;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;
  origin?: Premise;
  destination?: Premise;
  vehicle?: Vehicle;
}

export interface RouteStop {
  id: string;
  routeId: string;
  premiseId: string;
  sequence: number;
  distance: number;
  cost: number;
  duration: number;
  co2: number;
  premise?: Premise;
}

export interface Route {
  id: string;
  vehicleId: string;
  mode: 'fastest' | 'cheapest' | 'greenest' | 'balanced';
  totalDistance: number;
  totalCost: number;
  totalDuration: number;
  totalCO2: number;
  routeDate: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
  stops?: RouteStop[];
}

// === API Request/Response Types ===

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CalculateCostRequest {
  originId: string;
  destinationId: string;
  vehicleId: string;
  demand: number;
}

export interface CostBreakdown {
  distance: number;
  duration: number;
  fuelCost: number;
  laborCost: number;
  vehicleCost: number;
  carbonCost: number;
  totalCost: number;
  co2Emissions: number;
  isAlpine: boolean;
  hasOvertime: boolean;
  capacityUsed: number;
  capacityRemaining: number;
  origin: Premise;
  destination: Premise;
  vehicle: Vehicle;
}

export interface OptimizeRouteRequest {
  premiseIds: string[];
  vehicleId: string;
  mode: 'fastest' | 'cheapest' | 'greenest' | 'balanced';
}

export interface OptimizedRoute {
  route: {
    sequence: number;
    premise: Premise | { name: string; latitude: number; longitude: number };
    distance: number;
    cost: number;
    duration: number;
    co2: number;
  }[];
  totals: {
    distance: number;
    cost: number;
    duration: number;
    co2: number;
  };
  mode: string;
  vehicle: Vehicle;
}

export interface CreatePremiseRequest {
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  weeklyDemand: number;
}

export interface KPIMetrics {
  totalDeliveries: number;
  totalCost: number;
  totalDistance: number;
  totalCO2: number;
  averageCostPerDelivery: number;
  averageDistance: number;
}

export interface TrendData {
  date: string;
  totalCost: number;
  fuelCost: number;
  laborCost: number;
  vehicleCost: number;
  carbonCost: number;
  deliveryCount: number;
}

export interface FleetMetrics {
  vehicleId: string;
  vehicleName: string;
  vehicleType: string;
  deliveryCount: number;
  totalDistance: number;
  totalCost: number;
  totalCO2: number;
  averageCostPerDelivery: number;
}

export interface RouteMetrics {
  originId: string;
  destinationId: string;
  originName: string;
  destinationName: string;
  totalCost: number;
  totalDistance: number;
  deliveryCount: number;
}

export interface PremiseMetrics {
  premiseId: string;
  premiseName: string;
  category: string;
  deliveryCount: number;
  totalCost: number;
  totalDemand: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    timestamp: string;
    details?: { field: string; message: string }[];
  };
}

export interface PaginatedResponse<T> {
  deliveries: T[];
  total: number;
}
