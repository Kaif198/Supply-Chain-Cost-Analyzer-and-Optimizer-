import { DistanceCalculationService } from './DistanceCalculationService';
import { CostCalculationParams, CostBreakdown } from '../types/cost';

/**
 * CostCalculationService
 * 
 * Calculates delivery costs with itemized breakdown including fuel, labor, vehicle, and carbon costs.
 * Implements alpine route adjustments, overtime calculations, and CO2 emissions tracking.
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 16.1, 16.2, 16.3, 16.5
 */
export class CostCalculationService {
  private distanceService: DistanceCalculationService;

  // Cost constants
  private static readonly FUEL_PRICE_PER_LITER = 1.45; // €1.45 per liter
  private static readonly CARBON_OFFSET_PER_TON = 25; // €25 per ton of CO2
  private static readonly AVERAGE_SPEED_KMH = 60; // 60 km/h average speed
  private static readonly ALPINE_FUEL_MULTIPLIER = 1.15; // 15% increase for alpine routes
  private static readonly OVERTIME_THRESHOLD_HOURS = 8; // Overtime after 8 hours
  private static readonly OVERTIME_MULTIPLIER = 1.5; // 1.5x rate for overtime

  constructor() {
    this.distanceService = new DistanceCalculationService();
  }

  /**
   * Calculate complete delivery cost breakdown
   * 
   * @param params - Cost calculation parameters
   * @returns Complete cost breakdown with all components
   * @throws Error if demand exceeds vehicle capacity
   */
  calculateDeliveryCost(params: CostCalculationParams): CostBreakdown {
    const { origin, destination, vehicle, demand } = params;

    // Validate capacity constraint
    if (demand > vehicle.capacity) {
      throw new Error(
        `Capacity constraint violation: demand (${demand}) exceeds vehicle capacity (${vehicle.capacity})`
      );
    }

    // Calculate distance
    const distance = this.distanceService.calculateDistance(origin, destination);

    // Determine if route is alpine
    const isAlpine = this.distanceService.isAlpineRoute(origin, destination);

    // Calculate duration
    const duration = distance / CostCalculationService.AVERAGE_SPEED_KMH;

    // Calculate individual cost components
    const fuelCost = this.calculateFuelCost(distance, vehicle, isAlpine);
    const laborCost = this.calculateLaborCost(duration, vehicle);
    const vehicleCost = this.calculateVehicleCost(vehicle);
    const { co2Emissions, carbonCost } = this.calculateCarbonCost(distance, vehicle);

    // Calculate total cost
    const totalCost = fuelCost + laborCost + vehicleCost + carbonCost;

    // Determine if overtime occurred
    const hasOvertime = duration > CostCalculationService.OVERTIME_THRESHOLD_HOURS;

    return {
      fuelCost,
      laborCost,
      vehicleCost,
      carbonCost,
      totalCost,
      distance,
      duration,
      co2Emissions,
      isAlpine,
      hasOvertime,
    };
  }

  /**
   * Calculate fuel cost with alpine adjustment
   * 
   * @param distance - Distance in kilometers
   * @param vehicle - Vehicle with fuel consumption rate
   * @param isAlpine - Whether route is alpine
   * @returns Fuel cost in euros
   */
  calculateFuelCost(distance: number, vehicle: { fuelConsumptionRate: number }, isAlpine: boolean): number {
    // Base fuel consumption (liters per km * distance)
    let fuelConsumption = vehicle.fuelConsumptionRate * distance;

    // Apply alpine adjustment if needed
    if (isAlpine) {
      fuelConsumption *= CostCalculationService.ALPINE_FUEL_MULTIPLIER;
    }

    // Calculate cost
    return fuelConsumption * CostCalculationService.FUEL_PRICE_PER_LITER;
  }

  /**
   * Calculate labor cost with overtime
   * 
   * @param duration - Duration in hours
   * @param vehicle - Vehicle with hourly labor cost
   * @returns Labor cost in euros
   */
  calculateLaborCost(duration: number, vehicle: { hourlyLaborCost: number }): number {
    const hourlyRate = vehicle.hourlyLaborCost;

    if (duration <= CostCalculationService.OVERTIME_THRESHOLD_HOURS) {
      // No overtime
      return duration * hourlyRate;
    } else {
      // Calculate base hours + overtime hours
      const baseHours = CostCalculationService.OVERTIME_THRESHOLD_HOURS;
      const overtimeHours = duration - baseHours;

      const baseCost = baseHours * hourlyRate;
      const overtimeCost = overtimeHours * hourlyRate * CostCalculationService.OVERTIME_MULTIPLIER;

      return baseCost + overtimeCost;
    }
  }

  /**
   * Calculate vehicle fixed cost
   * 
   * @param vehicle - Vehicle with fixed cost per delivery
   * @returns Vehicle cost in euros
   */
  calculateVehicleCost(vehicle: { fixedCostPerDelivery: number }): number {
    return vehicle.fixedCostPerDelivery;
  }

  /**
   * Calculate CO2 emissions and carbon offset cost
   * 
   * @param distance - Distance in kilometers
   * @param vehicle - Vehicle with CO2 emission rate
   * @returns CO2 emissions in kg and carbon cost in euros
   */
  calculateCarbonCost(
    distance: number,
    vehicle: { co2EmissionRate: number }
  ): { co2Emissions: number; carbonCost: number } {
    // Calculate CO2 emissions (kg per km * distance)
    const co2Emissions = vehicle.co2EmissionRate * distance;

    // Convert kg to tons and calculate carbon offset cost
    const co2Tons = co2Emissions / 1000;
    const carbonCost = co2Tons * CostCalculationService.CARBON_OFFSET_PER_TON;

    return { co2Emissions, carbonCost };
  }
}
