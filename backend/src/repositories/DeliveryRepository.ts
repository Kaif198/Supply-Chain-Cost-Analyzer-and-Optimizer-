import prisma from '../utils/prisma';
import { Delivery } from '@prisma/client';

export interface DeliveryInput {
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
  deliveryDate: Date;
}

export interface DeliveryFilter {
  startDate?: Date;
  endDate?: Date;
  vehicleId?: string;
  originId?: string;
  destinationId?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export class DeliveryRepository {
  /**
   * Create a new delivery
   */
  async create(input: DeliveryInput): Promise<Delivery> {
    return await prisma.delivery.create({
      data: input,
    });
  }

  /**
   * Find delivery by ID
   */
  async findById(id: string): Promise<Delivery | null> {
    return await prisma.delivery.findUnique({
      where: { id },
      include: {
        origin: true,
        destination: true,
        vehicle: true,
      },
    });
  }

  /**
   * Find all deliveries with optional filtering and pagination
   */
  async findAll(
    filter?: DeliveryFilter,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Delivery>> {
    const where: any = {};

    // Date range filtering
    if (filter?.startDate || filter?.endDate) {
      where.deliveryDate = {};
      if (filter.startDate) {
        where.deliveryDate.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.deliveryDate.lte = filter.endDate;
      }
    }

    // Vehicle filtering
    if (filter?.vehicleId) {
      where.vehicleId = filter.vehicleId;
    }

    // Origin filtering
    if (filter?.originId) {
      where.originId = filter.originId;
    }

    // Destination filtering
    if (filter?.destinationId) {
      where.destinationId = filter.destinationId;
    }

    // Pagination
    const limit = pagination?.limit ?? 100;
    const offset = pagination?.offset ?? 0;

    // Execute queries in parallel
    const [data, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          origin: true,
          destination: true,
          vehicle: true,
        },
        orderBy: { deliveryDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.delivery.count({ where }),
    ]);

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  /**
   * Count deliveries by filter
   */
  async count(filter?: DeliveryFilter): Promise<number> {
    const where: any = {};

    if (filter?.startDate || filter?.endDate) {
      where.deliveryDate = {};
      if (filter.startDate) {
        where.deliveryDate.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.deliveryDate.lte = filter.endDate;
      }
    }

    if (filter?.vehicleId) {
      where.vehicleId = filter.vehicleId;
    }

    if (filter?.originId) {
      where.originId = filter.originId;
    }

    if (filter?.destinationId) {
      where.destinationId = filter.destinationId;
    }

    return await prisma.delivery.count({ where });
  }

  /**
   * Check if delivery exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.delivery.count({
      where: { id },
    });
    return count > 0;
  }
}

export default new DeliveryRepository();
