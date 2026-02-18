import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePremises, useVehicles } from './useQueries';
import * as api from '../services/api';

// Mock the API
vi.mock('../services/api');

describe('useQueries - Premises and Vehicles', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
    });

    afterEach(() => {
        queryClient.clear();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };

    describe('usePremises', () => {
        it('should fetch premises from API', async () => {
            const mockPremises = [
                {
                    id: 'premise-1',
                    name: 'Test Premise',
                    category: 'nightclub' as const,
                    address: 'Test Address',
                    latitude: 48.2,
                    longitude: 16.3,
                    elevation: 200,
                    weeklyDemand: 100,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];

            vi.mocked(api.premiseApi.list).mockResolvedValue(mockPremises);

            const { result } = renderHook(() => usePremises(), { wrapper });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockPremises);
            expect(api.premiseApi.list).toHaveBeenCalledWith(undefined);
        });

        it('should handle API errors', async () => {
            const error = new Error('API Error');
            vi.mocked(api.premiseApi.list).mockRejectedValue(error);

            const { result } = renderHook(() => usePremises(), { wrapper });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toBeTruthy();
        });
    });

    describe('useVehicles', () => {
        it('should fetch vehicles from API', async () => {
            const mockVehicles = [
                {
                    id: 'vehicle-1',
                    name: 'Small Van',
                    type: 'small_van' as const,
                    capacity: 800,
                    fuelConsumptionRate: 0.12,
                    co2EmissionRate: 0.28,
                    hourlyLaborCost: 25,
                    fixedCostPerDelivery: 15,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];

            vi.mocked(api.vehicleApi.list).mockResolvedValue(mockVehicles);

            const { result } = renderHook(() => useVehicles(), { wrapper });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockVehicles);
            expect(api.vehicleApi.list).toHaveBeenCalled();
        });

        it('should handle API errors', async () => {
            const error = new Error('API Error');
            vi.mocked(api.vehicleApi.list).mockRejectedValue(error);

            const { result } = renderHook(() => useVehicles(), { wrapper });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toBeTruthy();
        });
    });
});
