import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import { divIcon, LatLngBounds } from 'leaflet';
import { usePremises, useVehicles, useOptimizeRoute } from '../hooks/useQueries';
import { formatCurrency, formatDistance, formatDuration, formatCO2, getCategoryIcon } from '../utils/utils';
import type { OptimizedRoute, Premise } from '../types/types';
import 'leaflet/dist/leaflet.css';

const MODES = [
    { value: 'fastest', label: 'Fastest', color: 'text-amber-600' },
    { value: 'cheapest', label: 'Cheapest', color: 'text-emerald-600' },
    { value: 'greenest', label: 'Greenest', color: 'text-green-600' },
    { value: 'balanced', label: 'Balanced', color: 'text-blue-600' },
] as const;

const MODE_COLORS: Record<'fastest' | 'cheapest' | 'greenest' | 'balanced', string> = {
    fastest: '#3B82F6',
    cheapest: '#F97316',
    greenest: '#10B981',
    balanced: '#A855F7'
};

const createNumberedIcon = (number: number, isWarehouse: boolean = false) => {
    return divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: 32px;
                height: 32px;
                background-color: ${isWarehouse ? '#DC0032' : '#1e293b'};
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                color: white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            ">
                ${isWarehouse ? 'W' : number}
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

function MapBoundsFitter({ route }: { route: OptimizedRoute }) {
    const map = useMap();

    useEffect(() => {
        if (route && route.route.length > 0) {
            const bounds = new LatLngBounds(
                route.route.map(stop => [
                    stop.premise.latitude,
                    stop.premise.longitude
                ])
            );
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

    useEffect(() => {
        if (result && selectedPremiseIds.length > 0 && vehicleId) {
            handleOptimize();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Route Optimizer</h1>
                <p className="text-slate-500 mt-1">Find optimal delivery routes across multiple premises</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Premise Selection */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-card">
                    <h2 className="text-lg font-semibold text-slate-800">Select Premises</h2>
                    <input
                        type="text"
                        placeholder="Search by name or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-redbull-red/30 transition-all duration-200 text-sm"
                    />

                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">{selectedPremiseIds.length} selected</span>
                        <button
                            onClick={() => setSelectedPremiseIds([])}
                            className="text-xs text-slate-400 hover:text-redbull-red transition-all duration-200"
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
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-200 ${selected
                                        ? 'bg-redbull-red/5 border border-redbull-red/20 text-slate-800'
                                        : 'bg-transparent border border-transparent text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="text-sm font-medium text-slate-400">{getCategoryIcon(p.category)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate font-medium">{p.name}</p>
                                        <p className="text-xs text-slate-400">{p.category} · {p.weeklyDemand} cases/wk</p>
                                    </div>
                                    {selected && (
                                        <svg className="w-4 h-4 text-redbull-red flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Settings */}
                <div className="space-y-6">
                    {/* Vehicle */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-card">
                        <h2 className="text-lg font-semibold text-slate-800">Vehicle</h2>
                        <select
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-redbull-red/30 transition-all duration-200 text-sm"
                        >
                            <option value="">Select vehicle</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name} ({v.capacity} cases)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Mode */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-card">
                        <h2 className="text-lg font-semibold text-slate-800">Optimization Mode</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {MODES.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => setMode(m.value)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${mode === m.value
                                        ? 'bg-redbull-red/5 border border-redbull-red/20 text-slate-800'
                                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optimize Button */}
                    <button
                        onClick={handleOptimize}
                        disabled={selectedPremiseIds.length === 0 || !vehicleId || optimizeMutation.isPending}
                        className="w-full py-3 bg-redbull-red hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        {optimizeMutation.isPending ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                                Optimizing...
                            </>
                        ) : (
                            `Optimize Route (${selectedPremiseIds.length} stops)`
                        )}
                    </button>

                    {optimizeMutation.isError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            Optimization failed. Please check your selections.
                        </div>
                    )}
                </div>

                {/* Results */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Optimized Route</h2>

                    {!result ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            <p className="text-center">Select premises and click Optimize</p>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            {/* Map */}
                            <div className="h-64 rounded-xl overflow-hidden border border-slate-200">
                                <MapContainer
                                    center={[47.5, 13.5]}
                                    zoom={7}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapBoundsFitter route={result} />
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
                                <div className="bg-slate-50 rounded-xl p-3 text-center">
                                    <p className="text-slate-400 text-xs">Distance</p>
                                    <p className="text-slate-700 font-bold">{formatDistance(result.totals.distance)}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 text-center">
                                    <p className="text-slate-400 text-xs">Cost</p>
                                    <p className="text-redbull-red font-bold">{formatCurrency(result.totals.cost)}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 text-center">
                                    <p className="text-slate-400 text-xs">Duration</p>
                                    <p className="text-slate-700 font-bold">{formatDuration(result.totals.duration)}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 text-center">
                                    <p className="text-slate-400 text-xs">CO2</p>
                                    <p className="text-slate-700 font-bold">{formatCO2(result.totals.co2)}</p>
                                </div>
                            </div>

                            {/* Route Sequence */}
                            <div className="space-y-1">
                                <h3 className="text-sm font-medium text-slate-500 mb-2">Route Sequence</h3>
                                {result.route.map((stop, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl transition-colors duration-150 hover:bg-slate-100"
                                    >
                                        <div className="w-7 h-7 bg-redbull-red/10 text-redbull-red rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {stop.sequence}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-slate-700 text-sm truncate">{(stop.premise as Premise)?.name || 'Warehouse'}</p>
                                            <p className="text-slate-400 text-xs">
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
