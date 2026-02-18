import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CostCalculatorPage from './CostCalculatorPage';
import * as useQueries from '../hooks/useQueries';

// Mock the hooks
vi.mock('../hooks/useQueries');

describe('CostCalculatorPage - Dropdown Population', () => {
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

    it('should populate premises dropdown with data from API', async () => {
        // Mock premises data
        const mockPremises = [
            {
                id: 'premise-1',
                name: 'Test Nightclub',
                category: 'nightclub',
                address: 'Test Address 1',
                latitude: 48.2,
                longitude: 16.3,
                elevation: 200,
                weeklyDemand: 100,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'premise-2',
                name: 'Test Gym',
                category: 'gym',
                address: 'Test Address 2',
                latitude: 48.3,
                longitude: 16.4,
                elevation: 250,
                weeklyDemand: 150,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];

        // Mock the hooks
        vi.mocked(useQueries.usePremises).mockReturnValue({
            data: mockPremises,
            isLoading: false,
            isError: false,
            error: null,
        } as any);

        vi.mocked(useQueries.useVehicles).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
        } as any);

        vi.mocked(useQueries.useCalculateCost).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
        } as any);

        render(
            <QueryClientProvider client={queryClient}>
                <CostCalculatorPage />
            </QueryClientProvider>
        );

        // Wait for the component to render
        await waitFor(() => {
            expect(screen.getByText('Select a premise')).toBeInTheDocument();
        });

        // Check that premises are rendered in the dropdown
        expect(screen.getByText('Test Nightclub (nightclub)')).toBeInTheDocument();
        expect(screen.getByText('Test Gym (gym)')).toBeInTheDocument();
    });

    it('should populate vehicles dropdown with data from API', async () => {
        // Mock vehicles data
        const mockVehicles = [
            {
                id: 'vehicle-1',
                name: 'Small Van',
                type: 'small_van',
                capacity: 800,
                fuelConsumptionRate: 0.12,
                co2EmissionRate: 0.28,
                hourlyLaborCost: 25,
                fixedCostPerDelivery: 15,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'vehicle-2',
                name: 'Medium Truck',
                type: 'medium_truck',
                capacity: 2400,
                fuelConsumptionRate: 0.18,
                co2EmissionRate: 0.42,
                hourlyLaborCost: 30,
                fixedCostPerDelivery: 25,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];

        // Mock the hooks
        vi.mocked(useQueries.usePremises).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
        } as any);

        vi.mocked(useQueries.useVehicles).mockReturnValue({
            data: mockVehicles,
            isLoading: false,
            isError: false,
            error: null,
        } as any);

        vi.mocked(useQueries.useCalculateCost).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
        } as any);

        render(
            <QueryClientProvider client={queryClient}>
                <CostCalculatorPage />
            </QueryClientProvider>
        );

        // Wait for the component to render
        await waitFor(() => {
            expect(screen.getByText('Select a vehicle')).toBeInTheDocument();
        });

        // Check that vehicles are rendered in the dropdown
        expect(screen.getByText('Small Van (cap: 800 cases)')).toBeInTheDocument();
        expect(screen.getByText('Medium Truck (cap: 2400 cases)')).toBeInTheDocument();
    });

    it('should show loading state while fetching premises', async () => {
        // Mock loading state
        vi.mocked(useQueries.usePremises).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
        } as any);

        vi.mocked(useQueries.useVehicles).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
        } as any);

        vi.mocked(useQueries.useCalculateCost).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
        } as any);

        render(
            <QueryClientProvider client={queryClient}>
                <CostCalculatorPage />
            </QueryClientProvider>
        );

        // Check that loading state is shown
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading state while fetching vehicles', async () => {
        // Mock loading state
        vi.mocked(useQueries.usePremises).mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
        } as any);

        vi.mocked(useQueries.useVehicles).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
        } as any);

        vi.mocked(useQueries.useCalculateCost).mockReturnValue({
            mutateAsync: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
        } as any);

        render(
            <QueryClientProvider client={queryClient}>
                <CostCalculatorPage />
            </QueryClientProvider>
        );

        // Check that loading state is shown
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
});
