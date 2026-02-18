import axios from 'axios';
import type {
    LoginRequest,
    LoginResponse,
    Premise,
    Vehicle,
    Delivery,
    CostBreakdown,
    CalculateCostRequest,
    OptimizeRouteRequest,
    OptimizedRoute,
    CreatePremiseRequest,
    KPIMetrics,
    TrendData,
    FleetMetrics,
    RouteMetrics,
    PremiseMetrics,
    Route,
    PaginatedResponse,
} from '../types/types';

const api = axios.create({
    baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// === Auth API ===
export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const res = await api.post<LoginResponse>('/auth/login', data);
        return res.data;
    },
    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
    },
    me: async () => {
        const res = await api.get('/auth/me');
        return res.data;
    },
};

// === Delivery API ===
export const deliveryApi = {
    calculate: async (data: CalculateCostRequest): Promise<CostBreakdown> => {
        const res = await api.post<CostBreakdown>('/deliveries/calculate', data);
        return res.data;
    },
    list: async (params?: {
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedResponse<Delivery>> => {
        const res = await api.get('/deliveries', { params });
        return res.data;
    },
    create: async (data: Record<string, unknown>): Promise<Delivery> => {
        const res = await api.post<Delivery>('/deliveries', data);
        return res.data;
    },
};

// === Route API ===
export const routeApi = {
    optimize: async (data: OptimizeRouteRequest): Promise<OptimizedRoute> => {
        const res = await api.post<OptimizedRoute>('/routes/optimize', data);
        return res.data;
    },
    getById: async (id: string): Promise<Route> => {
        const res = await api.get<Route>(`/routes/${id}`);
        return res.data;
    },
};

// === Premise API ===
export const premiseApi = {
    list: async (params?: { category?: string; search?: string }): Promise<Premise[]> => {
        const res = await api.get<Premise[]>('/premises', { params });
        return res.data;
    },
    getById: async (id: string): Promise<Premise> => {
        const res = await api.get<Premise>(`/premises/${id}`);
        return res.data;
    },
    create: async (data: CreatePremiseRequest): Promise<Premise> => {
        const res = await api.post<Premise>('/premises', data);
        return res.data;
    },
    update: async (id: string, data: Partial<CreatePremiseRequest>): Promise<Premise> => {
        const res = await api.put<Premise>(`/premises/${id}`, data);
        return res.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/premises/${id}`);
    },
};

// === Vehicle API ===
export const vehicleApi = {
    list: async (): Promise<Vehicle[]> => {
        const res = await api.get<Vehicle[]>('/vehicles');
        return res.data;
    },
    getById: async (id: string): Promise<Vehicle> => {
        const res = await api.get<Vehicle>(`/vehicles/${id}`);
        return res.data;
    },
    update: async (id: string, data: Partial<Vehicle>): Promise<Vehicle> => {
        const res = await api.put<Vehicle>(`/vehicles/${id}`, data);
        return res.data;
    },
};

// === Analytics API ===
export const analyticsApi = {
    getKPIs: async (params: { startDate: string; endDate: string }): Promise<KPIMetrics> => {
        const res = await api.get<KPIMetrics>('/analytics/kpis', { params });
        return res.data;
    },
    getCostTrends: async (params: {
        startDate: string;
        endDate: string;
        granularity?: string;
    }): Promise<TrendData[]> => {
        const res = await api.get<TrendData[]>('/analytics/cost-trends', { params });
        return res.data;
    },
    getFleetUtilization: async (params: {
        startDate: string;
        endDate: string;
    }): Promise<FleetMetrics[]> => {
        const res = await api.get<FleetMetrics[]>('/analytics/fleet-utilization', { params });
        return res.data;
    },
    getTopRoutes: async (params: {
        startDate: string;
        endDate: string;
        limit?: number;
    }): Promise<RouteMetrics[]> => {
        const res = await api.get<RouteMetrics[]>('/analytics/top-routes', { params });
        return res.data;
    },
    getTopPremises: async (params: {
        startDate: string;
        endDate: string;
        limit?: number;
    }): Promise<PremiseMetrics[]> => {
        const res = await api.get<PremiseMetrics[]>('/analytics/top-premises', { params });
        return res.data;
    },
    export: async (data: {
        format: 'csv' | 'pdf';
        dateRange: { startDate: string; endDate: string };
    }): Promise<Blob> => {
        const res = await api.post('/analytics/export', data, { responseType: 'blob' });
        return res.data;
    },
};

export default api;
