import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { divIcon, LatLngBounds } from 'leaflet';
import { usePremises, useVehicles, useOptimizeRoute } from '../hooks/useQueries';
import { formatCurrency, formatDistance, formatDuration, formatCO2, getCategoryIcon } from '../utils/utils';
import type { OptimizedRoute, Premise } from '../types/types';
import 'leaflet/dist/leaflet.css';

const MODES = [
    { value: 'fastest', label: 'Fastest', icon: '⚡', color: 'text-amber-400' },
    { value: 'cheapest', label: 'Cheapest', icon: '💰', color: 'text-emerald-400' },
    { value: 'greenest', label: 'Greenest', icon: '🌿', color: 'text-green-400' },
    { value: 'balanced', label: 'Balanced', icon: '⚖️', color: 'text-blue-400' },
] as const;

// Color mapping for polylines based on optimization mode
const MODE_COLORS: Record<'fastest' | 'cheapest' | 'greenest' | 'balanced', string> = {
    fastest: '#3B82F6',   // blue
    cheapest: '#F97316',  // orange
    greenest: '#10B981',  // green
    balanced: '#A855F7'   // purple
};

// Create a custom numbered marker icon
const createNumberedIcon = (number: number, isWarehouse: boolean = false) => {
    return divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: 32px;
                height: 32px;
                background-color: ${isWarehouse ? '#DC2626' : '#1E293B'};
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                color: white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
                ${isWarehouse ? '🏭' : number}
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

// Component to handle map bounds fitting
function MapBoundsFitter({ route }: { route: OptimizedRoute }) {
    const map = useMap();

    useEffect(() => {
        if (route && route.route.length > 0) {
            // Calculate bounds from all stop coordinates
            const bounds = new LatLngBounds(
                route.route.map(stop => [
                    stop.premise.latitude,
                    stop.premise.longitude
                ])
            );

            // Fit bounds with padding for better visibility
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 12
            });
        }
    }, [route, map]);

    return null;
}

export default function RouteOptimizerPage() {
    const [selectedPremiseIds, setSelectedPremiseIds] = useState<string[]>([]);
    const [vehicleId, setVehicleId] = useState('');
    const [mode, setMode] = useState<'fastest' | 'cheapest' | 'greenest' | 'balanced'>('balanced');
    const [searchQuery, setSearchQuery] = useState('');
    const [result, setResult] = useState<OptimizedRoute | null>(null);

    const { data: premises = [] } = usePremises();
    const { data: vehicles = [] } = useVehicles();
    const optimizeMutation = useOptimizeRoute();

    const filteredPremises = premises.filter(
        (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const togglePremise = (id: string) => {
        setSelectedPremiseIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleOptimize = async () => {
        if (selectedPremiseIds.length === 0 || !vehicleId) return;
        try {
            const data = await optimizeMutation.mutateAsync({
                premiseIds: selectedPremiseIds,
                vehicleId,
                mode,
            });
            setResult(data);
        } catch {
            // Error handled by mutation state
        }
    };

    // Re-optimize when mode changes if we already have a result
    useEffect(() => {
        if (result && selectedPremiseIds.length > 0 && vehicleId) {
            handleOptimize();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Route Optimizer</h1>
                <p className="text-slate-400 mt-1">Find optimal delivery routes across multiple premises</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Premise Selection */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-white">Select Premises</h2>
                    <input
                        type="text"
                        placeholder="Search by name or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-redbull-red/50 transition-all text-sm"
                    />

                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs">{selectedPremiseIds.length} selected</span>
                        <button
                            onClick={() => setSelectedPremiseIds([])}
                            className="text-xs text-slate-500 hover:text-white transition-all duration-200"
                        >
                            Clear all
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                        {filteredPremises.map((p) => {
                            const selected = selectedPremiseIds.includes(p.id);
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => togglePremise(p.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${selected
                                            ? 'bg-redbull-red/20 border border-redbull-red/30 text-white'
                                            : 'bg-transparent border border-transparent text-slate-300 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-lg">{getCategoryIcon(p.category)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate font-medium">{p.name}</p>
                                        <p className="text-xs text-slate-500">{p.category} · {p.weeklyDemand} cases/wk</p>
                                    </div>
                                    {selected && (
                                        <span className="text-redbull-red">✓</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Settings */}
                <div className="space-y-6">
                    {/* Vehicle */}
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white">Vehicle</h2>
                        <select
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-redbull-red/50 transition-all text-sm"
                        >
                            <option value="" className="bg-slate-800">Select vehicle</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id} className="bg-slate-800">
                                    {v.name} ({v.capacity} cases)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Mode */}
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white">Optimization Mode</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {MODES.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => setMode(m.value)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mode === m.value
                                            ? 'bg-redbull-red/20 border border-redbull-red/30 text-white'
                                            : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <span>{m.icon}</span>
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optimize Button */}
                    <button
                        onClick={handleOptimize}
                        disabled={selectedPremiseIds.length === 0 || !vehicleId || optimizeMutation.isPending}
                        className="w-full py-3 bg-redbull-red hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-redbull-red/20 hover:shadow-redbull-red/30 flex items-center justify-center gap-2"
                    >
                        {optimizeMutation.isPending ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                                Optimizing...
                            </>
                        ) : (
                            `🛣️ Optimize Route (${selectedPremiseIds.length} stops)`
                        )}
                    </button>

                    {optimizeMutation.isError && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                            Optimization failed. Please check your selections.
                        </div>
                    )}
                </div>

                {/* Results */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Optimized Route</h2>

                    {!result ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            <p className="text-center">Select premises and click Optimize</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Map */}
                            <div className="h-64 rounded-xl overflow-hidden border border-white/10">
                                <MapContainer
                                    center={[47.5, 13.5]}
                                    zoom={7}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {/* Fit bounds to show all stops */}
                                    <MapBoundsFitter route={result} />
                                    {/* Route Polyline */}
                                    {result && result.route.length > 0 && (
                                        <>
                                            <Polyline
                                                positions={result.route.map(stop => [
                                                    stop.premise.latitude,
                                                    stop.premise.longitude
                                                ])}
                                                color={MODE_COLORS[mode]}
                                                weight={3}
                                                opacity={0.8}
                                            />
                                            {/* Numbered Markers for each stop */}
                                            {result.route.map((stop, index) => {
                                                const isWarehouse = stop.sequence === 0 || stop.sequence === result.route.length - 1;
                                                return (
                                                    <Marker
                                                        key={`${stop.sequence}-${index}`}
                                                        position={[stop.premise.latitude, stop.premise.longitude]}
                                                        icon={createNumberedIcon(stop.sequence, isWarehouse)}
                                                    />
                                                );
                                            })}
                                        </>
                                    )}
                                </MapContainer>
                            </div>

                            {/* Totals */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-slate-500 text-xs">Distance</p>
                                    <p className="text-white font-bold">{formatDistance(result.totals.distance)}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-slate-500 text-xs">Cost</p>
                                    <p className="text-redbull-red font-bold">{formatCurrency(result.totals.cost)}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-slate-500 text-xs">Duration</p>
                                    <p className="text-white font-bold">{formatDuration(result.totals.duration)}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-slate-500 text-xs">CO₂</p>
                                    <p className="text-white font-bold">{formatCO2(result.totals.co2)}</p>
                                </div>
                            </div>

                            {/* Route Sequence */}
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-slate-400 mb-2">Route Sequence</h3>
                                {result.route.map((stop, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl"
                                    >
                                        <div className="w-7 h-7 bg-redbull-red/20 text-redbull-red rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {stop.sequence}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm truncate">{(stop.premise as Premise)?.name || 'Warehouse'}</p>
                                            <p className="text-slate-500 text-xs">
                                                {formatDistance(stop.distance)} · {formatCurrency(stop.cost)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
