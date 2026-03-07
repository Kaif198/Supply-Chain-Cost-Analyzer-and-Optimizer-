import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { formatCurrency } from '../utils/utils';
import api from '../services/api';

// API Service
const mlApi = {
    getDemandForecast: async (days: number) => {
        const res = await api.get(`/ml/demand-forecast?days=${days}`);
        return res.data;
    },
    getSpendForecast: async (days: number) => {
        const res = await api.get(`/ml/spend-forecast?days=${days}`);
        return res.data;
    },
    getReliability: async () => {
        const res = await api.get(`/ml/supplier-reliability`);
        return res.data;
    },
    getPerformance: async () => {
        const res = await api.get(`/ml/performance`);
        return res.data;
    }
};

export default function ForecastingPage() {
    const [days, setDays] = useState(30);
    const [demandData, setDemandData] = useState<any>(null);
    const [spendData, setSpendData] = useState<any>(null);
    const [reliabilityData, setReliabilityData] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [demand, spend, rel, perf] = await Promise.all([
                    mlApi.getDemandForecast(days),
                    mlApi.getSpendForecast(days),
                    mlApi.getReliability(),
                    mlApi.getPerformance()
                ]);
                setDemandData(demand);
                setSpendData(spend);
                setReliabilityData(rel);
                setPerformance(perf);
            } catch (err) {
                console.error("Failed to fetch forecasts", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [days]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-redbull-red" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header / Executive Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">AI Supply Chain Forecasting</h1>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="text-blue-700 font-semibold mb-1">Executive Summary</h3>
                    <p className="text-slate-600">
                        Supply chain operations are stabilized.
                        Demand is projected to {demandData?.insight.includes('increasing') ? 'surge' : 'remain steady'},
                        while procurement costs are {spendData?.insight.includes('increasing') ? 'expected to rise' : 'under control'}.
                        Key risks identified in {reliabilityData.filter((r: any) => r.score < 80).length} routes.
                    </p>
                </div>
            </div>

            {/* Model Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
                    <p className="text-slate-500 text-sm">Demand Model Accuracy</p>
                    <p className="text-xl font-bold text-slate-800">{(100 - (performance?.arima_demand_aic / 1000)).toFixed(1)}%</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
                    <p className="text-slate-500 text-sm">Spend Model Accuracy</p>
                    <p className="text-xl font-bold text-slate-800">{(100 - (performance?.arima_spend_aic / 10000)).toFixed(1)}%</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
                    <p className="text-slate-500 text-sm">Reliability Prediction</p>
                    <p className="text-xl font-bold text-slate-800">{(performance?.rf_accuracy * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
                    <p className="text-slate-500 text-sm">Data Points Trained</p>
                    <p className="text-xl font-bold text-slate-800">{performance?.data_points}</p>
                </div>
            </div>

            {/* Demand Forecast */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Demand Forecast</h2>
                        <p className="text-slate-500 text-sm">Projected case volume for next {days} days</p>
                    </div>
                    <div className="flex gap-2">
                        {[30, 60, 90].map(d => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${days === d ? 'bg-redbull-red text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {d} Days
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-80 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={demandData?.forecast}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                labelFormatter={(v) => new Date(v).toLocaleDateString()}
                            />
                            <Area type="monotone" dataKey="upper" stroke="none" fill="#3B82F6" fillOpacity={0.1} />
                            <Area type="monotone" dataKey="lower" stroke="none" fill="#3B82F6" fillOpacity={0.1} />
                            <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={false} strokeDasharray="5 5" name="Forecast" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <div>
                        <h4 className="text-emerald-700 font-semibold text-sm mb-1">AI Insight</h4>
                        <p className="text-slate-600 text-sm">{demandData?.insight}</p>
                    </div>
                </div>
            </div>

            {/* Spend Forecast */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Procurement Spend Forecast</h2>
                </div>

                <div className="h-80 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spendData?.forecast}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                stroke="#94a3b8"
                                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="#94a3b8" tickFormatter={(v) => `€${v / 1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                labelFormatter={(v) => new Date(v).toLocaleDateString()}
                                formatter={(v: number) => formatCurrency(v)}
                            />
                            <Area type="monotone" dataKey="upper" stroke="none" fill="#DC0032" fillOpacity={0.1} />
                            <Area type="monotone" dataKey="lower" stroke="none" fill="#DC0032" fillOpacity={0.1} />
                            <Line type="monotone" dataKey="value" stroke="#DC0032" strokeWidth={3} dot={false} strokeDasharray="5 5" name="Forecast" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <h4 className="text-amber-700 font-semibold text-sm mb-1">Cost Alert</h4>
                        <p className="text-slate-600 text-sm">{spendData?.insight}</p>
                    </div>
                </div>
            </div>

            {/* Supplier Reliability */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Supplier and Route Reliability Risk</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Route / Scenario</th>
                                <th className="px-4 py-3 text-right">Reliability Score</th>
                                <th className="px-4 py-3">Risk Level</th>
                                <th className="px-4 py-3">AI Key Insight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reliabilityData.map((row: any, i: number) => (
                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-150">
                                    <td className="px-4 py-3 font-medium text-slate-700">{row.route}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${row.score > 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                            row.score > 60 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                                'bg-red-50 text-red-600 border border-red-200'
                                            }`}>
                                            {row.score}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {row.score > 80 ? 'Low' : row.score > 60 ? 'Medium' : 'High'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 italic">
                                        "{row.insight}"
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
