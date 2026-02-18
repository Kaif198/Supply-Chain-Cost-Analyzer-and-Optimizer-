export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface KPIMetrics {
  totalDeliveries: number;
  totalCost: number;
  totalDistance: number;
  totalCO2: number;
  averageCostPerDelivery: number;
  averageDistancePerDelivery: number;
}

export interface TrendData {
  date: string;
  totalCost: number;
  fuelCost: number;
  laborCost: number;
  vehicleCost: number;
  carbonCost: number;
}

export interface FleetMetrics {
  vehicleType: string;
  vehicleName: string;
  totalDeliveries: number;
  capacityUsed: number;
  capacityAvailable: number;
  utilizationPercentage: number;
}

export interface RouteMetrics {
  routeId: string;
  date: Date;
  totalCost: number;
  totalDistance: number;
  stopCount: number;
  vehicleType: string;
}

export interface PremiseMetrics {
  premiseId: string;
  premiseName: string;
  deliveryCount: number;
  totalCost: number;
  category: string;
}

export type Granularity = 'daily' | 'weekly' | 'monthly';