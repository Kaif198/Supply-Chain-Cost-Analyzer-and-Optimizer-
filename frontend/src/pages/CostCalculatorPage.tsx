import { useState } from 'react';
import { usePremises, useVehicles, useCalculateCost } from '../hooks/useQueries';
import { formatCurrency, formatDistance, formatDuration, formatCO2 } from '../utils/utils';
import type { CostBreakdown } from '../types/types';

export default function CostCalculatorPage() {
    const [originId, setOriginId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [demand, setDemand] = useState('');
    const [premiseSearch, setPremiseSearch] = useState('');
    const [result, setResult] = useState<CostBreakdown | null>(null);

    const { data: premises = [], isLoading: loadingPremises } = usePremises();
    const { data: vehicles = [], isLoading: loadingVehicles } = useVehicles();
    const calculateMutation = useCalculateCost();

    // Find the warehouse premise dynamically by name
    // The warehouse is stored as a Premise with name "Red Bull Distribution Center Fuschl"
    const warehousePremise = premises.find(p => 
        p.name.toLowerCase().includes('red bull distribution') || 
        p.name.toLowerCase().includes('distribution center fuschl')
    );
    const WAREHOUSE_ID = warehousePremise?.id || '';
    
    // Debug log (can be removed in production)
    if (premises.length > 0 && !WAREHOUSE_ID) {
        console.warn('Warehouse premise not found in premises list');
    }

    const filteredPremises = premises.filter((p) =>
        p.name.toLowerCase().includes(premiseSearch.toLowerCase())
    );

    const handleCalculate = async () => {
        if (!originId || !vehicleId || !demand || !WAREHOUSE_ID) {
            console.log('❌ Calculate blocked - missing required fields:', {
                originId,
                vehicleId,
                demand,
                WAREHOUSE_ID
            });
            return;
        }
        
        const requestBody = {
            originId: WAREHOUSE_ID,
            destinationId: originId,
            vehicleId,
            demand: parseInt(demand, 10),
        };
        
        console.log('🚀 Calling calculate API with:', requestBody);
        
        try {
            const data = await calculateMutation.mutateAsync(requestBody);
            console.log('✅ Calculate API response:', data);
            setResult(data);
        } catch (error) {
            console.error('❌ Calculate API error:', error);
            // Error handled by mutation state
        }
    };

    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Cost Calculator</h1>
                <p className="text-slate-400 mt-1">Calculate delivery costs from warehouse to any premise</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Card */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-white">Delivery Parameters</h2>

                    {/* Premise Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Destination Premise</label>
                        <input
                            type="text"
                            placeholder="Search premises..."
                            value={premiseSearch}
                            onChange={(e) => setPremiseSearch(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-redbull-red/50 transition-all mb-2 text-sm"
                        />
                        <select
                            value={originId}
                            onChange={(e) => setOriginId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-redbull-red/50 transition-all text-sm"
                        >
                            <option value="" className="bg-slate-800">Select a premise</option>
                            {loadingPremises ? (
                                <option className="bg-slate-800">Loading...</option>
                            ) : (
                                filteredPremises.map((p) => (
                                    <option key={p.id} value={p.id} className="bg-slate-800">
                                        {p.name} ({p.category})
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Vehicle Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Vehicle</label>
                        <select
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-redbull-red/50 transition-all text-sm"
                        >
                            <option value="" className="bg-slate-800">Select a vehicle</option>
                            {loadingVehicles ? (
                                <option className="bg-slate-800">Loading...</option>
                            ) : (
                                vehicles.map((v) => (
                                    <option key={v.id} value={v.id} className="bg-slate-800">
                                        {v.name} (cap: {v.capacity} cases)
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Demand */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Demand (cases)
                            {selectedVehicle && (
                                <span className="text-slate-500 ml-2">max: {selectedVehicle.capacity}</span>
                            )}
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={selectedVehicle?.capacity}
                            value={demand}
                            onChange={(e) => setDemand(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-redbull-red/50 transition-all text-sm"
                            placeholder="Enter number of cases"
                        />
                    </div>

                    {/* Calculate Button */}
                    {!WAREHOUSE_ID && !loadingPremises && (
                        <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-300 text-sm">
                            ⚠️ Warehouse not found. Please ensure the database is properly seeded.
                        </div>
                    )}
                    
                    <button
                        onClick={handleCalculate}
                        disabled={!originId || !vehicleId || !demand || !WAREHOUSE_ID || calculateMutation.isPending}
                        className="w-full py-3 bg-redbull-red hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-redbull-red/20 hover:shadow-redbull-red/30 flex items-center justify-center gap-2"
                    >
                        {calculateMutation.isPending ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                                Calculating...
                            </>
                        ) : (
                            '⚡ Calculate Cost'
                        )}
                    </button>

                    {calculateMutation.isError && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                            {(calculateMutation.error as Error)?.message || 'Calculation failed. Check inputs.'}
                        </div>
                    )}
                </div>

                {/* Results Card */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h2>

                    {!result ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <p>Select parameters and click Calculate</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Total */}
                            <div className="bg-redbull-red/10 border border-redbull-red/20 rounded-xl p-4 text-center">
                                <p className="text-slate-400 text-sm">Total Cost</p>
                                <p className="text-3xl font-bold text-redbull-red">{formatCurrency(result.totalCost)}</p>
                            </div>

                            {/* Breakdown */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Fuel Cost', value: result.fuelCost, color: 'text-amber-400' },
                                    { label: 'Labor Cost', value: result.laborCost, color: 'text-blue-400' },
                                    { label: 'Vehicle Cost', value: result.vehicleCost, color: 'text-purple-400' },
                                    { label: 'Carbon Cost', value: result.carbonCost, color: 'text-emerald-400' },
                                ].map((item) => (
                                    <div key={item.label} className="bg-white/5 rounded-xl p-3">
                                        <p className="text-slate-500 text-xs">{item.label}</p>
                                        <p className={`text-lg font-semibold ${item.color}`}>{formatCurrency(item.value)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-slate-500 text-xs">Distance</p>
                                    <p className="text-white font-semibold">{formatDistance(result.distance)}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-slate-500 text-xs">Duration</p>
                                    <p className="text-white font-semibold">{formatDuration(result.duration)}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-slate-500 text-xs">CO₂</p>
                                    <p className="text-white font-semibold">{formatCO2(result.co2Emissions)}</p>
                                </div>
                            </div>

                            {/* Flags */}
                            <div className="flex gap-2 flex-wrap">
                                {result.isAlpine && (
                                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                        🏔️ Alpine Route (+15% fuel)
                                    </span>
                                )}
                                {result.hasOvertime && (
                                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full">
                                        ⏰ Overtime Applied
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
