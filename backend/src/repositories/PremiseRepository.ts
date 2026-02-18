import prisma from '../utils/prisma';
import { Premise } from '@prisma/client';

// Austrian boundary constants
const AUSTRIAN_BOUNDS = {
  MIN_LAT: 46.4,
  MAX_LAT: 49.0,
  MIN_LON: 9.5,
  MAX_LON: 17.2,
};

export interface PremiseInput {
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  weeklyDemand: number;
}

export interface PremiseFilter {
  category?: string;
  search?: string;
}

export class PremiseRepository {
  /**
   * Validate that coordinates are within Austrian boundaries
   */
  private validateAustrianBoundaries(latitude: number, longitude: number): void {
    if (
      latitude < AUSTRIAN_BOUNDS.MIN_LAT ||
      latitude > AUSTRIAN_BOUNDS.MAX_LAT ||
      longitude < AUSTRIAN_BOUNDS.MIN_LON ||
      longitude > AUSTRIAN_BOUNDS.MAX_LON
    ) {
      throw new Error(
        `Coordinates must be within Austrian boundaries (${AUSTRIAN_BOUNDS.MIN_LAT}°-${AUSTRIAN_BOUNDS.MAX_LAT}°N, ${AUSTRIAN_BOUNDS.MIN_LON}°-${AUSTRIAN_BOUNDS.MAX_LON}°E)`
      );
    }
  }

  /**
   * Validate premise input data
   */
  private validatePremiseInput(input: PremiseInput): void {
    // Validate coordinates
    this.validateAustrianBoundaries(input.latitude, input.longitude);

    // Validate weekly demand is positive integer
    if (!Number.isInteger(input.weeklyDemand) || input.weeklyDemand <= 0) {
      throw new Error('Weekly demand must be a positive integer');
    }

    // Validate category
    const validCategories = ['nightclub', 'gym', 'retail', 'restaurant', 'hotel'];
    if (!validCategories.includes(input.category)) {
      throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
    }
  }

  /**
   * Create a new premise
   */
  async create(input: PremiseInput): Promise<Premise> {
    this.validatePremiseInput(input);

    return await prisma.premise.create({
      data: {
        name: input.name,
        category: input.category,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        elevation: input.elevation ?? 0,
        weeklyDemand: input.weeklyDemand,
      },
    });
  }

  /**
   * Find premise by ID
   */
  async findById(id: string): Promise<Premise | null> {
    return await prisma.premise.findUnique({
      where: { id },
    });
  }

  /**
   * Find all premises with optional filtering
   */
  async findAll(filter?: PremiseFilter): Promise<Premise[]> {
    const where: any = {};

    // Filter by category
    if (filter?.category) {
      where.category = filter.category;
    }

    // Search by name (case-insensitive)
    if (filter?.search) {
      where.name = {
        contains: filter.search,
        mode: 'insensitive',
      };
    }

    return await prisma.premise.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update a premise
   */
  async update(id: string, input: Partial<PremiseInput>): Promise<Premise> {
    // Validate coordinates if provided
    if (input.latitude !== undefined && input.longitude !== undefined) {
      this.validateAustrianBoundaries(input.latitude, input.longitude);
    }

    // Validate weekly demand if provided
    if (input.weeklyDemand !== undefined) {
      if (!Number.isInteger(input.weeklyDemand) || input.weeklyDemand <= 0) {
        throw new Error('Weekly demand must be a positive integer');
      }
    }

    // Validate category if provided
    if (input.category !== undefined) {
      const validCategories = ['nightclub', 'gym', 'retail', 'restaurant', 'hotel'];
      if (!validCategories.includes(input.category)) {
        throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
      }
    }

    return await prisma.premise.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete a premise (only if no active deliveries)
   */
  async delete(id: string): Promise<void> {
    // Check for active deliveries
    const deliveryCount = await prisma.delivery.count({
      where: {
        OR: [{ originId: id }, { destinationId: id }],
      },
    });

    if (deliveryCount > 0) {
      throw new Error(
        `Cannot delete premise with ${deliveryCount} associated deliveries`
      );
    }

    await prisma.premise.delete({
      where: { id },
    });
  }

  /**
   * Check if premise exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.premise.count({
      where: { id },
    });
    return count > 0;
  }
}

export default new PremiseRepository();
