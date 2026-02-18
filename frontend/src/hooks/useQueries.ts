import { useQuery, useMutation } from '@tanstack/react-query';
import { premiseApi, vehicleApi, deliveryApi, routeApi, analyticsApi } from '../services/api';
import type {
    CalculateCostRequest,
    OptimizeRouteRequest,
    CreatePremiseRequest,
} from '../types/types';

// === Premise Hooks ===
export function usePremises(params?: { category?: string; search?: string }) {
    return useQuery({
        queryKey: ['premises', params],
        queryFn: () => premiseApi.list(params),
        staleTime: 30_000,
    });
}

export function usePremise(id: string) {
    return useQuery({
        queryKey: ['premises', id],
        queryFn: () => premiseApi.getById(id),
        enabled: !!id,
    });
}

export function useCreatePremise() {
    return useMutation({
        mutationFn: (data: CreatePremiseRequest) => premiseApi.create(data),
    });
}

export function useUpdatePremise() {
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreatePremiseRequest> }) =>
            premiseApi.update(id, data),
    });
}

export function useDeletePremise() {
    return useMutation({
        mutationFn: (id: string) => premiseApi.delete(id),
    });
}

// === Vehicle Hooks ===
export function useVehicles() {
    return useQuery({
        queryKey: ['vehicles'],
        queryFn: () => vehicleApi.list(),
        staleTime: 60_000,
    });
}

// === Delivery Hooks ===
export function useDeliveries(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}) {
    return useQuery({
        queryKey: ['deliveries', params],
        queryFn: () => deliveryApi.list(params),
        staleTime: 30_000,
    });
}

export function useCalculateCost() {
    return useMutation({
        mutationFn: (data: CalculateCostRequest) => deliveryApi.calculate(data),
    });
}

// === Route Hooks ===
export function useOptimizeRoute() {
    return useMutation({
        mutationFn: (data: OptimizeRouteRequest) => routeApi.optimize(data),
    });
}

// === Analytics Hooks ===
export function useAnalyticsKPIs(params: { startDate: string; endDate: string }) {
    return useQuery({
        queryKey: ['analytics', 'kpis', params],
        queryFn: () => analyticsApi.getKPIs(params),
        staleTime: 60_000,
        enabled: !!params.startDate && !!params.endDate,
    });
}

export function useCostTrends(params: {
    startDate: string;
    endDate: string;
    granularity?: string;
}) {
    return useQuery({
        queryKey: ['analytics', 'cost-trends', params],
        queryFn: () => analyticsApi.getCostTrends(params),
        staleTime: 60_000,
        enabled: !!params.startDate && !!params.endDate,
    });
}

export function useFleetUtilization(params: { startDate: string; endDate: string }) {
    return useQuery({
        queryKey: ['analytics', 'fleet-utilization', params],
        queryFn: () => analyticsApi.getFleetUtilization(params),
        staleTime: 60_000,
        enabled: !!params.startDate && !!params.endDate,
    });
}

export function useTopRoutes(params: { startDate: string; endDate: string; limit?: number }) {
    return useQuery({
        queryKey: ['analytics', 'top-routes', params],
        queryFn: () => analyticsApi.getTopRoutes(params),
        staleTime: 60_000,
        enabled: !!params.startDate && !!params.endDate,
    });
}

export function useTopPremises(params: { startDate: string; endDate: string; limit?: number }) {
    return useQuery({
        queryKey: ['analytics', 'top-premises', params],
        queryFn: () => analyticsApi.getTopPremises(params),
        staleTime: 60_000,
        enabled: !!params.startDate && !!params.endDate,
    });
}
