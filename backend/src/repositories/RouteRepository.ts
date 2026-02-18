import prisma from '../utils/prisma';
import { Route, RouteStop } from '@prisma/client';

export interface RouteStopInput {
  premiseId: string;
  sequence: number;
  distance: number;
  cost: number;
  duration: number;
  co2: number;
}

export interface RouteInput {
  vehicleId: string;
  mode: string;
  totalDistance: number;
  totalCost: number;
  totalDuration: number;
  totalCO2: number;
  routeDate: Date;
  stops: RouteStopInput[];
}

export interface RouteFilter {
  startDate?: Date;
  endDate?: Date;
  vehicleId?: string;
  mode?: string;
}

export interface RouteWithStops extends Route {
  stops: (RouteStop & {
    premise: {
      id: string;
      name: string;
      category: string;
      address: string;
      latitude: number;
      longitude: number;
      elevation: number;
      weeklyDemand: number;
    };
  })[];
  vehicle: {
    id: string;
    name: string;
    type: string;
    capacity: number;
  };
}

export class RouteRepository {
  /**
   * Create a new route with stops
   */
  async create(input: RouteInput): Promise<RouteWithStops> {
    const route = await prisma.route.create({
      data: {
        vehicleId: input.vehicleId,
        mode: input.mode,
        totalDistance: input.totalDistance,
        totalCost: input.totalCost,
        totalDuration: input.totalDuration,
        totalCO2: input.totalCO2,
        routeDate: input.routeDate,
        stops: {
          create: input.stops,
        },
      },
      include: {
        stops: {
          include: {
            premise: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
        vehicle: true,
      },
    });

    return route as RouteWithStops;
  }

  /**
   * Find route by ID
   */
  async findById(id: string): Promise<RouteWithStops | null> {
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        stops: {
          include: {
            premise: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
        vehicle: true,
      },
    });

    return route as RouteWithStops | null;
  }

  /**
   * Find all routes with optional filtering
   */
  async findAll(filter?: RouteFilter): Promise<RouteWithStops[]> {
    const where: any = {};

    // Date range filtering
    if (filter?.startDate || filter?.endDate) {
      where.routeDate = {};
      if (filter.startDate) {
        where.routeDate.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.routeDate.lte = filter.endDate;
      }
    }

    // Vehicle filtering
    if (filter?.vehicleId) {
      where.vehicleId = filter.vehicleId;
    }

    // Mode filtering
    if (filter?.mode) {
      where.mode = filter.mode;
    }

    const routes = await prisma.route.findMany({
      where,
      include: {
        stops: {
          include: {
            premise: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
        vehicle: true,
      },
      orderBy: { routeDate: 'desc' },
    });

    return routes as RouteWithStops[];
  }

  /**
   * Count routes by filter
   */
  async count(filter?: RouteFilter): Promise<number> {
    const where: any = {};

    if (filter?.startDate || filter?.endDate) {
      where.routeDate = {};
      if (filter.startDate) {
        where.routeDate.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.routeDate.lte = filter.endDate;
      }
    }

    if (filter?.vehicleId) {
      where.vehicleId = filter.vehicleId;
    }

    if (filter?.mode) {
      where.mode = filter.mode;
    }

    return await prisma.route.count({ where });
  }

  /**
   * Delete a route (cascade deletes stops)
   */
  async delete(id: string): Promise<void> {
    await prisma.route.delete({
      where: { id },
    });
  }

  /**
   * Check if route exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.route.count({
      where: { id },
    });
    return count > 0;
  }
}

export default new RouteRepository();
