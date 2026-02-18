import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RouteOptimizerPage from './RouteOptimizerPage';
import * as api from '../services/api';

// Mock the API
vi.mock('../services/api');

describe('RouteOptimizerPage - Mode Change Behavior', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();

        // Mock premises
        vi.mocked(api.premiseApi.list).mockResolvedValue([
            {
                id: 'premise-1',
                name: 'Test Nightclub',
                category: 'nightclub' as const,
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
                category: 'gym' as const,
                address: 'Test Address 2',
                latitude: 48.3,
                longitude: 16.4,
                elevation: 250,
                weeklyDemand: 150,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ]);

        // Mock vehicles
        vi.mocked(api.vehicleApi.list).mockResolvedValue([
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
        ]);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };

    it('should trigger new API call when mode changes after initial optimization', async () => {
        const user = userEvent.setup();

        // Mock optimize API response
        const mockOptimizedRoute = {
            route: [
                {
                    sequence: 1,
                    premise: { name: 'Warehouse', latitude: 47.8011, longitude: 13.2760 },
                    distance: 0,
                    cost: 0,
                    duration: 0,
                    co2: 0,
                },
                {
                    sequence: 2,
                    premise: { name: 'Test Nightclub', latitude: 48.2, longitude: 16.3 },
                    distance: 10,
                    cost: 25,
                    duration: 0.5,
                    co2: 2.8,
                },
            ],
            totals: {
                distance: 10,
                cost: 25,
                duration: 0.5,
                co2: 2.8,
            },
            mode: 'balanced',
            vehicle: {
                id: 'vehicle-1',
                name: 'Small Van',
            } as any,
        };

        vi.mocked(api.routeApi.optimize).mockResolvedValue(mockOptimizedRoute);

        render(<RouteOptimizerPage />, { wrapper });

        // Wait for premises and vehicles to load
        await waitFor(() => {
            expect(screen.getByText('Test Nightclub')).toBeInTheDocument();
        });

        // Select a premise
        await user.click(screen.getByText('Test Nightclub'));

        // Select a vehicle
        const vehicleSelect = screen.getByRole('combobox');
        await user.selectOptions(vehicleSelect, 'vehicle-1');

        // Click optimize button
        const optimizeButton = screen.getByRole('button', { name: /optimize route/i });
        await user.click(optimizeButton);

        // Wait for optimization to complete
        await waitFor(() => {
            expect(api.routeApi.optimize).toHaveBeenCalledTimes(1);
        });

        // Verify initial call was made with 'balanced' mode (default)
        expect(api.routeApi.optimize).toHaveBeenCalledWith({
            premiseIds: ['premise-1'],
            vehicleId: 'vehicle-1',
            mode: 'balanced',
        });

        // Change mode to 'fastest'
        const fastestButton = screen.getByRole('button', { name: /fastest/i });
        await user.click(fastestButton);

        // Wait for new API call to be triggered
        await waitFor(() => {
            expect(api.routeApi.optimize).toHaveBeenCalledTimes(2);
        });

        // Verify second call was made with 'fastest' mode
        expect(api.routeApi.optimize).toHaveBeenNthCalledWith(2, {
            premiseIds: ['premise-1'],
            vehicleId: 'vehicle-1',
            mode: 'fastest',
        });
    });

    it('should not trigger API call when mode changes before initial optimization', async () => {
        const user = userEvent.setup();

        render(<RouteOptimizerPage />, { wrapper });

        // Wait for premises to load
        await waitFor(() => {
            expect(screen.getByText('Test Nightclub')).toBeInTheDocument();
        });

        // Change mode without optimizing first
        const fastestButton = screen.getByRole('button', { name: /fastest/i });
        await user.click(fastestButton);

        // Verify no API call was made
        expect(api.routeApi.optimize).not.toHaveBeenCalled();
    });

    it('should make fresh API calls for each mode change (no caching)', async () => {
        const user = userEvent.setup();

        const mockRoute1 = {
            route: [{ sequence: 1, premise: { name: 'Stop 1', latitude: 48.2, longitude: 16.3 }, distance: 10, cost: 20, duration: 0.5, co2: 2 }],
            totals: { distance: 10, cost: 20, duration: 0.5, co2: 2 },
            mode: 'balanced',
            vehicle: { id: 'vehicle-1', name: 'Small Van' } as any,
        };

        const mockRoute2 = {
            route: [{ sequence: 1, premise: { name: 'Stop 1', latitude: 48.2, longitude: 16.3 }, distance: 12, cost: 18, duration: 0.4, co2: 3 }],
            totals: { distance: 12, cost: 18, duration: 0.4, co2: 3 },
            mode: 'fastest',
            vehicle: { id: 'vehicle-1', name: 'Small Van' } as any,
        };

        vi.mocked(api.routeApi.optimize)
            .mockResolvedValueOnce(mockRoute1)
            .mockResolvedValueOnce(mockRoute2);

        render(<RouteOptimizerPage />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Test Nightclub')).toBeInTheDocument();
        });

        // Select premise and vehicle
        await user.click(screen.getByText('Test Nightclub'));
        const vehicleSelect = screen.getByRole('combobox');
        await user.selectOptions(vehicleSelect, 'vehicle-1');

        // Initial optimization
        await user.click(screen.getByRole('button', { name: /optimize route/i }));

        await waitFor(() => {
            expect(api.routeApi.optimize).toHaveBeenCalledTimes(1);
        });

        // Verify initial result is displayed
        expect(screen.getByText('10.0 km')).toBeInTheDocument();

        // Change mode
        await user.click(screen.getByRole('button', { name: /fastest/i }));

        // Verify new API call was made
        await waitFor(() => {
            expect(api.routeApi.optimize).toHaveBeenCalledTimes(2);
        });

        // Verify new result is displayed (not cached)
        await waitFor(() => {
            expect(screen.getByText('12.0 km')).toBeInTheDocument();
        });

        expect(api.routeApi.optimize).toHaveBeenCalledTimes(2);
    });
});

describe('RouteOptimizerPage - Map Updates', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();

        // Mock premises
        vi.mocked(api.premiseApi.list).mockResolvedValue([
            {
                id: 'premise-1',
                name: 'Test Nightclub',
                category: 'nightclub' as const,
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
                category: 'gym' as const,
                address: 'Test Address 2',
                latitude: 48.3,
                longitude: 16.4,
                elevation: 250,
                weeklyDemand: 150,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ]);

        // Mock vehicles
        vi.mocked(api.vehicleApi.list).mockResolvedValue([
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
        ]);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };

    it('should update map polyline color when mode changes', async () => {
        const user = userEvent.setup();

        // Mock optimize API responses with different routes for different modes
        const mockBalancedRoute = {
            route: [
                {
                    sequence: 0,
                    premise: { name: 'Warehouse', latitude: 47.8011, longitude: 13.2760 },
                    distance: 0,
                    cost: 0,
                    duration: 0,
                    co2: 0,
                },
                {
                    sequence: 1,
                    premise: { name: 'Test Nightclub', latitude: 48.2, longitude: 16.3 },
                    distance: 10,
                    cost: 25,
                    duration: 0.5,
                    co2: 2.8,
                },
            ],
            totals: {
                distance: 10,
                cost: 25,
                duration: 0.5,
                co2: 2.8,
            },
            mode: 'balanced',
            vehicle: {
                id: 'vehicle-1',
                name: 'Small Van',
            } as any,
        };

        const mockFastestRoute = {
            route: [
                {
                    sequence: 0,
                    premise: { name: 'Warehouse', latitude: 47.8011, longitude: 13.2760 },
                    distance: 0,
                    cost: 0,
                    duration: 0,
                    co2: 0,
                },
                {
                    sequence: 1,
                    premise: { name: 'Test Gym', latitude: 48.3, longitude: 16.4 },
                    distance: 12,
                    cost: 30,
                    duration: 0.4,
                    co2: 3.2,
                },
            ],
            totals: {
                distance: 12,
                cost: 30,
                duration: 0.4,
                co2: 3.2,
            },
            mode: 'fastest',
            vehicle: {
                id: 'vehicle-1',
                name: 'Small Van',
            } as any,
        };

        vi.mocked(api.routeApi.optimize)
            .mockResolvedValueOnce(mockBalancedRoute)
            .mockResolvedValueOnce(mockFastestRoute);

        render(<RouteOptimizerPage />, { wrapper });

        // Wait for premises and vehicles to load
        await waitFor(() => {
            expect(screen.getByText('Test Nightclub')).toBeInTheDocument();
        });

        // Select a premise
        await user.click(screen.getByText('Test Nightclub'));

        // Select a vehicle
        const vehicleSelect = screen.getByRole('combobox');
        await user.selectOptions(vehicleSelect, 'vehicle-1');

        // Click optimize button
        const optimizeButton = screen.getByRole('button', { name: /optimize route/i });
        await user.click(optimizeButton);

        // Wait for optimization to complete and map to render
        await waitFor(() => {
            expect(screen.getByTestId('map-container')).toBeInTheDocument();
        });

        // Verify initial polyline color is purple (balanced mode)
        const initialPolyline = screen.getByTestId('polyline');
        expect(initialPolyline).toHaveAttribute('data-color', '#A855F7');

        // Change mode to 'fastest'
        const fastestButton = screen.getByRole('button', { name: /fastest/i });
        await user.click(fastestButton);

        // Wait for new route to be fetched and map to update
        await waitFor(() => {
            expect(api.routeApi.optimize).toHaveBeenCalledTimes(2);
        });

        // Verify polyline color changed to blue (fastest mode)
        await waitFor(() => {
            const updatedPolyline = screen.getByTestId('polyline');
            expect(updatedPolyline).toHaveAttribute('data-color', '#3B82F6');
        });
    });

    it('should update map markers when route changes', async () => {
        const user = userEvent.setup();

        // Mock optimize API responses with different routes
        const mockRoute1 = {
            route: [
                {
                    sequence: 0,
                    premise: { name: 'Warehouse', latitude: 47.8011, longitude: 13.2760 },
                    distance: 0,
                    cost: 0,
                    duration: 0,
                    co2: 0,
                },
                {
                    sequence: 1,
                    premise: { name: 'Test Nightclub', latitude: 48.2, longitude: 16.3 },
                    distance: 10,
                    cost: 25,
                    duration: 0.5,
                    co2: 2.8,
                },
            ],
            totals: { distance: 10, cost: 25, duration: 0.5, co2: 2.8 },
            mode: 'balanced',
            vehicle: { id: 'vehicle-1', name: 'Small Van' } as any,
        };

        const mockRoute2 = {
            route: [
                {
                    sequence: 0,
                    premise: { name: 'Warehouse', latitude: 47.8011, longitude: 13.2760 },
                    distance: 0,
                    cost: 0,
                    duration: 0,
                    co2: 0,
                },
                {
                    sequence: 1,
                    premise: { name: 'Test Gym', latitude: 48.3, longitude: 16.4 },
                    distance: 12,
                    cost: 30,
                    duration: 0.4,
                    co2: 3.2,
                },
                {
                    sequence: 2,
                    premise: { name: 'Test Nightclub', latitude: 48.2, longitude: 16.3 },
                    distance: 15,
                    cost: 35,
                    duration: 0.6,
                    co2: 4.0,
                },
            ],
            totals: { distance: 27, cost: 65, duration: 1.0, co2: 7.2 },
            mode: 'cheapest',
            vehicle: { id: 'vehicle-1', name: 'Small Van' } as any,
        };

        vi.mocked(api.routeApi.optimize)
            .mockResolvedValueOnce(mockRoute1)
            .mockResolvedValueOnce(mockRoute2);

        render(<RouteOptimizerPage />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Test Nightclub')).toBeInTheDocument();
        });

        // Select premises
        await user.click(screen.getByText('Test Nightclub'));
        await user.click(screen.getByText('Test Gym'));

        // Select vehicle
        const vehicleSelect = screen.getByRole('combobox');
        await user.selectOptions(vehicleSelect, 'vehicle-1');

        // Initial optimization
        await user.click(screen.getByRole('button', { name: /optimize route/i }));

        await waitFor(() => {
            expect(screen.getByTestId('map-container')).toBeInTheDocument();
        });

        // Verify initial markers (2 stops)
        let markers = screen.getAllByTestId('marker');
        expect(markers).toHaveLength(2);

        // Change mode to cheapest
        await user.click(screen.getByRole('button', { name: /cheapest/i }));

        await waitFor(() => {
            expect(api.routeApi.optimize).toHaveBeenCalledTimes(2);
        });

        // Verify markers updated (3 stops now)
        await waitFor(() => {
            markers = screen.getAllByTestId('marker');
            expect(markers).toHaveLength(3);
        });
    });

    it('should clear previous route before showing new route', async () => {
        const user = userEvent.setup();

        const mockRoute1 = {
            route: [
                {
                    sequence: 0,
                    premise: { name: 'Warehouse', latitude: 47.8011, longitude: 13.2760 },
                    distance: 0,
                    cost: 0,
                    duration: 0,
                    co2: 0,
                },
                {
                    sequence: 1,
                    premise: { name: 'Test Nightclub', latitude: 48.2, longitude: 16.3 },
                    distance: 10,
                    cost: 25,
                    duration: 0.5,
                    co2: 2.8,
                },
            ],
            totals: { distance: 10, cost: 25, duration: 0.5, co2: 2.8 },
            mode: 'balanced',
            vehicle: { id: 'vehicle-1', name: 'Small Van' } as any,
        };

        const mockRoute2 = {
            route: [
                {
                    sequence: 0,
                    premise: { name: 'Warehouse', latitude: 47.8011, longitude: 13.2760 },
                    distance: 0,
                    cost: 0,
                    duration: 0,
                    co2: 0,
                },
                {
                    sequence: 1,
                    premise: { name: 'Test Gym', latitude: 48.3, longitude: 16.4 },
                    distance: 12,
                    cost: 30,
                    duration: 0.4,
                    co2: 3.2,
                },
            ],
            totals: { distance: 12, cost: 30, duration: 0.4, co2: 3.2 },
            mode: 'fastest',
            vehicle: { id: 'vehicle-1', name: 'Small Van' } as any,
        };

        vi.mocked(api.routeApi.optimize)
            .mockResolvedValueOnce(mockRoute1)
            .mockResolvedValueOnce(mockRoute2);

        render(<RouteOptimizerPage />, { wrapper });

        await waitFor(() => {
            expect(screen.getByText('Test Nightclub')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Test Nightclub'));
        const vehicleSelect = screen.getByRole('combobox');
        await user.selectOptions(vehicleSelect, 'vehicle-1');
        await user.click(screen.getByRole('button', { name: /optimize route/i }));

        await waitFor(() => {
            expect(screen.getByTestId('polyline')).toBeInTheDocument();
        });

        // Get initial polyline positions
        const initialPolyline = screen.getByTestId('polyline');
        const initialPositions = JSON.parse(initialPolyline.getAttribute('data-positions') || '[]');
        expect(initialPositions).toEqual([[47.8011, 13.2760], [48.2, 16.3]]);

        // Change mode
        await user.click(screen.getByRole('button', { name: /fastest/i }));

        await waitFor(() => {
            expect(api.routeApi.optimize).toHaveBeenCalledTimes(2);
        });

        // Verify polyline positions updated to new route
        await waitFor(() => {
            const updatedPolyline = screen.getByTestId('polyline');
            const updatedPositions = JSON.parse(updatedPolyline.getAttribute('data-positions') || '[]');
            expect(updatedPositions).toEqual([[47.8011, 13.2760], [48.3, 16.4]]);
        });
    });
});
