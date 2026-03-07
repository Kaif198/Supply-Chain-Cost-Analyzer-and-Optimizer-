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

    const KPICard = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) => (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    {icon}
                </div>
                <span className="text-slate-500 text-sm">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
                    <p className="text-slate-500 mt-1">Supply chain performance metrics</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="date"
                        value={startDate.split('T')[0]}
                        onChange={(e) => setStartDate(new Date(e.target.value).toISOString())}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/30 transition-all duration-200"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                        type="date"
                        value={endDate.split('T')[0]}
                        onChange={(e) => setEndDate(new Date(e.target.value).toISOString())}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-redbull-red/30 transition-all duration-200"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('csv')}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 hover:text-slate-800 transition-all duration-200"
                        >
                            CSV
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 hover:text-slate-800 transition-all duration-200"
                        >
                            PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            {loadingKPIs ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse h-24" />
                    ))}
                </div>
            ) : kpis ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                    <KPICard label="Total Deliveries" value={kpis.totalDeliveries.toLocaleString()} icon={<svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} color="bg-blue-50" />
                    <KPICard label="Total Cost" value={formatCurrency(kpis.totalCost)} icon={<svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="bg-amber-50" />
                    <KPICard label="Total Distance" value={formatDistance(kpis.totalDistance)} icon={<svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>} color="bg-purple-50" />
                    <KPICard label="Total CO2" value={formatCO2(kpis.totalCO2)} icon={<svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="bg-emerald-50" />
                </div>
            ) : null}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cost Trend Line Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Cost Trends</h2>
                    {loadingTrends ? (
                        <div className="h-64 animate-pulse bg-slate-50 rounded-xl" />
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(v) => new Date(v).toLocaleDateString('de-AT', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                    labelStyle={{ color: '#64748b' }}
                                    formatter={(value: number) => [formatCurrency(value)]}
                                />
                                <Line type="monotone" dataKey="totalCost" stroke="#DC0032" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Cost Breakdown Pie */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Cost Breakdown</h2>
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
                                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                            No data available
                        </div>
                    )}
                </div>
            </div>

            {/* Fleet Utilization + Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fleet Bar Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Fleet Utilization</h2>
                    {fleet.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={fleet}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="vehicleName" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                    formatter={(value: number, name: string) => [
                                        name === 'totalCost' ? formatCurrency(value) : value,
                                        name,
                                    ]}
                                />
                                <Bar dataKey="deliveryCount" fill="#DC0032" radius={[6, 6, 0, 0]} name="Deliveries" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                            No fleet data available
                        </div>
                    )}
                </div>

                {/* Top Routes Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Top 10 Most Expensive Routes</h2>
                    {topRoutes.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-slate-500 text-xs border-b border-slate-100">
                                        <th className="text-left pb-2">Route</th>
                                        <th className="text-right pb-2">Cost</th>
                                        <th className="text-right pb-2"># </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topRoutes.map((r, i) => (
                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-150">
                                            <td className="py-2 text-slate-700 truncate max-w-32">
                                                {r.originName} → {r.destinationName}
                                            </td>
                                            <td className="py-2 text-right text-amber-600 font-medium">{formatCurrency(r.totalCost)}</td>
                                            <td className="py-2 text-right text-slate-500">{r.deliveryCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                            No route data available
                        </div>
                    )}
                </div>
            </div>

            {/* Top Premises Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Top 10 Most Frequent Premises</h2>
                {topPremises.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-500 text-xs border-b border-slate-100">
                                    <th className="text-left pb-2">Premise</th>
                                    <th className="text-left pb-2">Category</th>
                                    <th className="text-right pb-2">Deliveries</th>
                                    <th className="text-right pb-2">Total Cost</th>
                                    <th className="text-right pb-2">Total Demand</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topPremises.map((p, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-150">
                                        <td className="py-2 text-slate-700">{p.premiseName}</td>
                                        <td className="py-2 text-slate-500 capitalize">{p.category}</td>
                                        <td className="py-2 text-right text-slate-600">{p.deliveryCount}</td>
                                        <td className="py-2 text-right text-amber-600 font-medium">{formatCurrency(p.totalCost)}</td>
                                        <td className="py-2 text-right text-slate-600">{p.totalDemand?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
                        No premise data available
                    </div>
                )}
            </div>
        </div>
    );
}
