import prisma from '../utils/prisma';
import { Vehicle } from '@prisma/client';

export interface VehicleUpdateInput {
  fuelConsumptionRate?: number;
  co2EmissionRate?: number;
  hourlyLaborCost?: number;
  fixedCostPerDelivery?: number;
}

export class VehicleRepository {
  /**
   * Validate vehicle update parameters
   */
  private validateUpdateInput(input: VehicleUpdateInput): void {
    // Validate fuel consumption rate
    if (input.fuelConsumptionRate !== undefined) {
      if (input.fuelConsumptionRate <= 0) {
        throw new Error('Fuel consumption rate must be a positive number');
      }
    }

    // Validate CO2 emission rate
    if (input.co2EmissionRate !== undefined) {
      if (input.co2EmissionRate <= 0) {
        throw new Error('CO2 emission rate must be a positive number');
      }
    }

    // Validate hourly labor cost
    if (input.hourlyLaborCost !== undefined) {
      if (input.hourlyLaborCost <= 0) {
        throw new Error('Hourly labor cost must be a positive number');
      }
    }

    // Validate fixed cost per delivery
    if (input.fixedCostPerDelivery !== undefined) {
      if (input.fixedCostPerDelivery <= 0) {
        throw new Error('Fixed cost per delivery must be a positive number');
      }
    }
  }

  /**
   * Find vehicle by ID
   */
  async findById(id: string): Promise<Vehicle | null> {
    return await prisma.vehicle.findUnique({
      where: { id },
    });
  }

  /**
   * Find all vehicles
   */
  async findAll(): Promise<Vehicle[]> {
    return await prisma.vehicle.findMany({
      orderBy: { capacity: 'asc' },
    });
  }

  /**
   * Update vehicle cost parameters
   */
  async update(id: string, input: VehicleUpdateInput): Promise<Vehicle> {
    this.validateUpdateInput(input);

    return await prisma.vehicle.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Check if vehicle exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.vehicle.count({
      where: { id },
    });
    return count > 0;
  }
}

export default new VehicleRepository();
