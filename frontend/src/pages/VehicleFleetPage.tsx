import { useState } from 'react';
import { useVehicles } from '../hooks/useQueries';
import { vehicleApi } from '../services/api';
import { formatCurrency } from '../utils/utils';
import type { Vehicle } from '../types/types';

const VEHICLE_LABELS: Record<string, string> = {
    small_van: 'Small Van',
    medium_truck: 'Medium Truck',
    large_truck: 'Large Truck',
};

const VEHICLE_COLORS: Record<string, string> = {
    small_van: 'from-emerald-50 to-emerald-25 border-emerald-200',
    medium_truck: 'from-blue-50 to-blue-25 border-blue-200',
    large_truck: 'from-purple-50 to-purple-25 border-purple-200',
};

const VEHICLE_ICON_COLORS: Record<string, string> = {
    small_van: 'text-emerald-600',
    medium_truck: 'text-blue-600',
    large_truck: 'text-purple-600',
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
                <h1 className="text-2xl font-bold text-slate-800">Vehicle Fleet</h1>
                <p className="text-slate-500 text-sm mt-1">
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
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <p className="text-red-600">Failed to load vehicles</p>
                </div>
            )}

            {/* Vehicle Grid */}
            {!isLoading && !error && vehicles && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
                    {vehicles.map((v) => (
                        <div
                            key={v.id}
                            className={`bg-gradient-to-br ${VEHICLE_COLORS[v.type] || 'from-slate-50 to-slate-25 border-slate-200'} border rounded-2xl p-6 hover:shadow-card-hover transition-all duration-300 shadow-card`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm ${VEHICLE_ICON_COLORS[v.type] || 'text-slate-600'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-800 font-semibold text-lg">{v.name}</h3>
                                        <p className="text-slate-500 text-xs">{VEHICLE_LABELS[v.type] || v.type}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditingVehicle({ ...v })}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/50 transition-all duration-200"
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
                                <Stat label="CO2 Rate" value={`${v.co2EmissionRate} kg/km`} />
                                <Stat label="Labor Cost" value={`${formatCurrency(v.hourlyLaborCost)}/hr`} />
                                <Stat label="Fixed Cost" value={`${formatCurrency(v.fixedCostPerDelivery)}/trip`} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingVehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-fade-in">
                        <h2 className="text-lg font-semibold text-slate-800 mb-1">
                            Edit {editingVehicle.name}
                        </h2>
                        <p className="text-slate-500 text-xs mb-5">
                            Adjust cost and emission parameters
                        </p>

                        <div className="space-y-4">
                            <Field
                                label="Fuel Consumption (L/km)"
                                value={editingVehicle.fuelConsumptionRate}
                                onChange={(v) => setEditingVehicle({ ...editingVehicle, fuelConsumptionRate: v })}
                            />
                            <Field
                                label="CO2 Emission Rate (kg/km)"
                                value={editingVehicle.co2EmissionRate}
                                onChange={(v) => setEditingVehicle({ ...editingVehicle, co2EmissionRate: v })}
                            />
                            <Field
                                label="Hourly Labor Cost (EUR)"
                                value={editingVehicle.hourlyLaborCost}
                                onChange={(v) => setEditingVehicle({ ...editingVehicle, hourlyLaborCost: v })}
                            />
                            <Field
                                label="Fixed Cost per Delivery (EUR)"
                                value={editingVehicle.fixedCostPerDelivery}
                                onChange={(v) => setEditingVehicle({ ...editingVehicle, fixedCostPerDelivery: v })}
                            />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingVehicle(null)}
                                className="flex-1 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 text-sm text-white bg-redbull-red rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all duration-200 font-medium"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
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
        <div className="bg-white/60 rounded-xl px-3 py-2.5 border border-white/80">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm text-slate-700 font-medium">{value}</p>
        </div>
    );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-redbull-red/30 transition-all duration-200"
            />
        </div>
    );
}
