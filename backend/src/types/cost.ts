import { Coordinates } from './coordinates';

export interface Vehicle {
  id: string;
  name: string;
  type: string;
  capacity: number;
  fuelConsumptionRate: number;
  co2EmissionRate: number;
  hourlyLaborCost: number;
  fixedCostPerDelivery: number;
}

export interface CostCalculationParams {
  origin: Coordinates;
  destination: Coordinates;
  vehicle: Vehicle;
  demand: number;
}

export interface CostBreakdown {
  fuelCost: number;
  laborCost: number;
  vehicleCost: number;
  carbonCost: number;
  totalCost: number;
  distance: number;
  duration: number;
  co2Emissions: number;
  isAlpine: boolean;
  hasOvertime: boolean;
}
