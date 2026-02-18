import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }: { children: React.ReactNode }) => 
        React.createElement('div', { 'data-testid': 'map-container' }, children),
    TileLayer: () => 
        React.createElement('div', { 'data-testid': 'tile-layer' }),
    Polyline: ({ positions, color }: { positions: [number, number][]; color: string }) => 
        React.createElement('div', { 
            'data-testid': 'polyline', 
            'data-positions': JSON.stringify(positions), 
            'data-color': color 
        }),
    Marker: ({ position, icon }: { position: [number, number]; icon: any }) => 
        React.createElement('div', { 
            'data-testid': 'marker', 
            'data-position': JSON.stringify(position), 
            'data-icon': JSON.stringify(icon) 
        }),
    useMap: () => ({
        fitBounds: vi.fn(),
    }),
}));
