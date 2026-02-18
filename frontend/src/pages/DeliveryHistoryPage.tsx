import { useState } from 'react';
import { useDeliveries } from '../hooks/useQueries';
import { formatCurrency, formatDistance, formatDuration, formatDate, formatCO2 } from '../utils/utils';

const PAGE_SIZE = 15;

export default function DeliveryHistoryPage() {
    const [offset, setOffset] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { data, isLoading, error } = useDeliveries({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: PAGE_SIZE,
        offset,
    });

    const deliveries = data?.deliveries ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Delivery History</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {total} total deliveries recorded
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setOffset(0); }}
                            className="bg-slate-700/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setOffset(0); }}
                            className="bg-slate-700/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); setOffset(0); }}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
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
                    <p className="text-red-400">Failed to load deliveries</p>
                    <p className="text-slate-500 text-sm mt-1">{(error as Error).message}</p>
                </div>
            )}

            {/* Table */}
            {!isLoading && !error && (
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">Date</th>
                                    <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">Distance</th>
                                    <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">Duration</th>
                                    <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">Demand</th>
                                    <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">Fuel</th>
                                    <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">Labor</th>
                                    <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">Vehicle</th>
                                    <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">Carbon</th>
                                    <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">Total Cost</th>
                                    <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">CO₂</th>
                                    <th className="text-center text-xs text-slate-400 font-medium px-4 py-3">Flags</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveries.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="text-center py-12 text-slate-500">
                                            No deliveries found
                                        </td>
                                    </tr>
                                ) : (
                                    deliveries.map((d) => (
                                        <tr
                                            key={d.id}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-4 py-3 text-white whitespace-nowrap">
                                                {formatDate(d.deliveryDate)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                                                {formatDistance(d.distance)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                                                {formatDuration(d.duration)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {d.demand.toLocaleString()} cases
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-300">
                                                {formatCurrency(d.fuelCost)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-300">
                                                {formatCurrency(d.laborCost)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-300">
                                                {formatCurrency(d.vehicleCost)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-300">
                                                {formatCurrency(d.carbonCost)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-white font-medium">
                                                {formatCurrency(d.totalCost)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-emerald-400">
                                                {formatCO2(d.co2Emissions)}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                {d.isAlpine && (
                                                    <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-400 rounded-full mr-1">
                                                        🏔 Alpine
                                                    </span>
                                                )}
                                                {d.hasOvertime && (
                                                    <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 rounded-full">
                                                        ⏰ OT
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                            <p className="text-xs text-slate-500">
                                Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
                            </p>
                            <div className="flex gap-1">
                                <button
                                    disabled={currentPage <= 1}
                                    onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                                    className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Prev
                                </button>
                                <span className="px-3 py-1.5 text-xs text-slate-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setOffset(offset + PAGE_SIZE)}
                                    className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
