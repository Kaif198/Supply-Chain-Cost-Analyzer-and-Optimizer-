import { useState } from 'react';
import { useVehicles } from '../hooks/useQueries';
import { vehicleApi } from '../services/api';
import { formatCurrency } from '../utils/utils';
import type { Vehicle } from '../types/types';

const VEHICLE_ICONS: Record<string, string> = {
    small_van: '🚐',
    medium_truck: '🚛',
    large_truck: '🚚',
};

const VEHICLE_LABELS: Record<string, string> = {
    small_van: 'Small Van',
    medium_truck: 'Medium Truck',
    large_truck: 'Large Truck',
};

const VEHICLE_COLORS: Record<string, string> = {
    small_van: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    medium_truck: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
    large_truck: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
};

export default function VehicleFleetPage() {
    const { data: vehicles, isLoading, error, refetch } = useVehicles();
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!editingVehicle) return;
        setSaving(true);
        try {
            await vehicleApi.update(editingVehicle.id, {
                fuelConsumptionRate: editingVehicle.fuelConsumptionRate,
                co2EmissionRate: editingVehicle.co2EmissionRate,
                hourlyLaborCost: editingVehicle.hourlyLaborCost,
                fixedCostPerDelivery: editingVehicle.fixedCostPerDelivery,
            });
            setEditingVehicle(null);
            refetch();
        } catch (err) {
            console.error('Failed to update vehicle:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Vehicle Fleet</h1>
                <p className="text-slate-400 text-sm mt-1">
                    Manage vehicle specifications and cost parameters
                </p>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-redbull-red" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                    <p className="text-red-400">Failed to load vehicles</p>
                </div>
            )}

            {/* Vehicle Grid */}
            {!isLoading && !error && vehicles && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {vehicles.map((v) => (
                        <div
                            key={v.id}
                            className={`bg-gradient-to-br ${VEHICLE_COLORS[v.type] || 'from-slate-500/20 to-slate-600/5 border-slate-500/20'} border rounded-2xl p-6 hover:shadow-lg transition-all duration-300`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{VEHICLE_ICONS[v.type] || '🚗'}</span>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">{v.name}</h3>
                                        <p className="text-slate-400 text-xs">{VEHICLE_LABELS[v.type] || v.type}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditingVehicle({ ...v })}
                                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                    title="Edit"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <Stat label="Capacity" value={`${v.capacity.toLocaleString()} cases`} />
                                <Stat label="Fuel Rate" value={`${v.fuelConsumptionRate} L/km`} />
                                <Stat label="CO₂ Rate" value={`${v.co2EmissionRate} kg/km`} />
                                <Stat label="Labor Cost" value={`${formatCurrency(v.hourlyLaborCost)}/hr`} />
                                <Stat label="Fixed Cost" value={`${formatCurrency(v.fixedCostPerDelivery)}/trip`} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingVehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h2 className="text-lg font-semibold text-white mb-1">
                            Edit {editingVehicle.name}
                        </h2>
                        <p className="text-slate-400 text-xs mb-5">
                            Adjust cost and emission parameters
                        </p>

                        <div className="space-y-4">
                            <Field
                                label="Fuel Consumption (L/km)"
                                value={editingVehicle.fuelConsumptionRate}
                                onChange={(v) => setEditingVehicle({ ...editingVehicle, fuelConsumptionRate: v })}
                            />
                            <Field
                                label="CO₂ Emission Rate (kg/km)"
                                value={editingVehicle.co2EmissionRate}
                                onChange={(v) => setEditingVehicle({ ...editingVehicle, co2EmissionRate: v })}
                            />
                            <Field
                                label="Hourly Labor Cost (€)"
                                value={editingVehicle.hourlyLaborCost}
                                onChange={(v) => setEditingVehicle({ ...editingVehicle, hourlyLaborCost: v })}
                            />
                            <Field
                                label="Fixed Cost per Delivery (€)"
                                value={editingVehicle.fixedCostPerDelivery}
                                onChange={(v) => setEditingVehicle({ ...editingVehicle, fixedCostPerDelivery: v })}
                            />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingVehicle(null)}
                                className="flex-1 px-4 py-2.5 text-sm text-slate-300 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 text-sm text-white bg-redbull-red rounded-xl hover:bg-redbull-red/90 disabled:opacity-50 transition-colors font-medium"
                            >
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-black/20 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm text-white font-medium">{value}</p>
        </div>
    );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
            />
        </div>
    );
}
