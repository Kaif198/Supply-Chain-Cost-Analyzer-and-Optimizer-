import { useState, useMemo } from 'react';
import {
    useAnalyticsKPIs,
    useCostTrends,
    useFleetUtilization,
    useTopRoutes,
    useTopPremises,
} from '../hooks/useQueries';
import { formatCurrency, formatDistance, formatCO2 } from '../utils/utils';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar,
} from 'recharts';
import { analyticsApi } from '../services/api';

const PIE_COLORS = ['#DC0032', '#0A1931', '#C0C0C0', '#10B981'];

export default function AnalyticsDashboardPage() {
    const today = new Date();
    const [startDate, setStartDate] = useState(
        new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString()
    );
    const [endDate, setEndDate] = useState(today.toISOString());

    const dateParams = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);

    const { data: kpis, isLoading: loadingKPIs } = useAnalyticsKPIs(dateParams);
    const { data: trends = [], isLoading: loadingTrends } = useCostTrends({ ...dateParams, granularity: 'daily' });
    const { data: fleet = [] } = useFleetUtilization(dateParams);
    const { data: topRoutes = [] } = useTopRoutes({ ...dateParams, limit: 10 });
    const { data: topPremises = [] } = useTopPremises({ ...dateParams, limit: 10 });

    // Prepare pie chart data from KPIs
    const pieData = useMemo(() => {
        if (!kpis) return [];
        // Use trend aggregation if available
        const totalFuel = trends.reduce((s, t) => s + (t.fuelCost || 0), 0);
        const totalLabor = trends.reduce((s, t) => s + (t.laborCost || 0), 0);
        const totalVehicle = trends.reduce((s, t) => s + (t.vehicleCost || 0), 0);
        const totalCarbon = trends.reduce((s, t) => s + (t.carbonCost || 0), 0);
        if (totalFuel + totalLabor + totalVehicle + totalCarbon === 0) return [];
        return [
            { name: 'Fuel', value: totalFuel },
            { name: 'Labor', value: totalLabor },
            { name: 'Vehicle', value: totalVehicle },
            { name: 'Carbon', value: totalCarbon },
        ];
    }, [kpis, trends]);

    const handleExport = async (format: 'csv' | 'pdf') => {
        try {
            const blob = await analyticsApi.export({ format, dateRange: { startDate, endDate } });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-export.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert('Export failed. Please try again.');
        }
    };

    const KPICard = ({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) => (
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>
                    {icon}
                </div>
                <span className="text-slate-400 text-sm">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                    <p className="text-slate-400 mt-1">Supply chain performance metrics</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="date"
                        value={startDate.split('T')[0]}
                        onChange={(e) => setStartDate(new Date(e.target.value).toISOString())}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                        type="date"
                        value={endDate.split('T')[0]}
                        onChange={(e) => setEndDate(new Date(e.target.value).toISOString())}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/50"
                    />
                    <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('csv')}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm hover:bg-white/10 hover:text-white transition-all duration-200"
                    >
                        📥 CSV
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm hover:bg-white/10 hover:text-white transition-all duration-200"
                    >
                        📄 PDF
                    </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            {loadingKPIs ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white/5 rounded-2xl p-5 animate-pulse h-24" />
                    ))}
                </div>
            ) : kpis ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard label="Total Deliveries" value={kpis.totalDeliveries.toLocaleString()} icon="📦" color="bg-blue-500/20" />
                    <KPICard label="Total Cost" value={formatCurrency(kpis.totalCost)} icon="💰" color="bg-amber-500/20" />
                    <KPICard label="Total Distance" value={formatDistance(kpis.totalDistance)} icon="🛣️" color="bg-purple-500/20" />
                    <KPICard label="Total CO₂" value={formatCO2(kpis.totalCO2)} icon="🌿" color="bg-emerald-500/20" />
                </div>
            ) : null}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cost Trend Line Chart */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Cost Trends</h2>
                    {loadingTrends ? (
                        <div className="h-64 animate-pulse bg-white/5 rounded-xl" />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748B"
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(v) => new Date(v).toLocaleDateString('de-AT', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 12 }}
                                    labelStyle={{ color: '#94A3B8' }}
                                    formatter={(value: number) => [formatCurrency(value)]}
                                />
                                <Line type="monotone" dataKey="totalCost" stroke="#DC0032" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Cost Breakdown Pie */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h2>
                    {pieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        innerRadius={40}
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-3 justify-center mt-2">
                                {pieData.map((d, i) => (
                                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-300">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                            No data available
                        </div>
                    )}
                </div>
            </div>

            {/* Fleet Utilization + Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fleet Bar Chart */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Fleet Utilization</h2>
                    {fleet.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={fleet}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="vehicleName" stroke="#64748B" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 12 }}
                                    formatter={(value: number, name: string) => [
                                        name === 'totalCost' ? formatCurrency(value) : value,
                                        name,
                                    ]}
                                />
                                <Bar dataKey="deliveryCount" fill="#DC0032" radius={[6, 6, 0, 0]} name="Deliveries" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                            No fleet data available
                        </div>
                    )}
                </div>

                {/* Top Routes Table */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Top 10 Most Expensive Routes</h2>
                    {topRoutes.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-slate-400 text-xs border-b border-white/5">
                                        <th className="text-left pb-2">Route</th>
                                        <th className="text-right pb-2">Cost</th>
                                        <th className="text-right pb-2"># </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topRoutes.map((r, i) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-2 text-white truncate max-w-32">
                                                {r.originName} → {r.destinationName}
                                            </td>
                                            <td className="py-2 text-right text-amber-400">{formatCurrency(r.totalCost)}</td>
                                            <td className="py-2 text-right text-slate-400">{r.deliveryCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                            No route data available
                        </div>
                    )}
                </div>
            </div>

            {/* Top Premises Table */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Top 10 Most Frequent Premises</h2>
                {topPremises.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 text-xs border-b border-white/5">
                                    <th className="text-left pb-2">Premise</th>
                                    <th className="text-left pb-2">Category</th>
                                    <th className="text-right pb-2">Deliveries</th>
                                    <th className="text-right pb-2">Total Cost</th>
                                    <th className="text-right pb-2">Total Demand</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topPremises.map((p, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-2 text-white">{p.premiseName}</td>
                                        <td className="py-2 text-slate-400 capitalize">{p.category}</td>
                                        <td className="py-2 text-right text-slate-300">{p.deliveryCount}</td>
                                        <td className="py-2 text-right text-amber-400">{formatCurrency(p.totalCost)}</td>
                                        <td className="py-2 text-right text-slate-300">{p.totalDemand?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
                        No premise data available
                    </div>
                )}
            </div>
        </div>
    );
}
