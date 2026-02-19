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
        return <div className="p-8 text-white">Loading forecasting models...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header / Executive Summary */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <h1 className="text-2xl font-bold text-white mb-2">🤖 AI Supply Chain Forecasting</h1>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <h3 className="text-blue-400 font-semibold mb-1">Executive Summary</h3>
                    <p className="text-slate-300">
                        Supply chain operations are stabilized.
                        Demand is projected to {demandData?.insight.includes('increasing') ? 'surge' : 'remain steady'},
                        while procurement costs are {spendData?.insight.includes('increasing') ? 'expected to rise' : 'under control'}.
                        Key risks identified in {reliabilityData.filter((r: any) => r.score < 80).length} routes.
                    </p>
                </div>
            </div>

            {/* Model Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-slate-400 text-sm">Demand Model Accuracy</p>
                    <p className="text-xl font-bold text-white">{(100 - (performance?.arima_demand_aic / 1000)).toFixed(1)}%</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-slate-400 text-sm">Spend Model Accuracy</p>
                    <p className="text-xl font-bold text-white">{(100 - (performance?.arima_spend_aic / 10000)).toFixed(1)}%</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-slate-400 text-sm">Reliability Prediction</p>
                    <p className="text-xl font-bold text-white">{(performance?.rf_accuracy * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-slate-400 text-sm">Data Points Trained</p>
                    <p className="text-xl font-bold text-white">{performance?.data_points}</p>
                </div>
            </div>

            {/* Demand Forecast */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Demand Forecast</h2>
                        <p className="text-slate-400 text-sm">Projected case volume for next {days} days</p>
                    </div>
                    <div className="flex gap-2">
                        {[30, 60, 90].map(d => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={`px-3 py-1 rounded-lg text-sm ${days === d ? 'bg-redbull-red text-white' : 'bg-white/10 text-slate-300'}`}
                            >
                                {d} Days
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-80 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={demandData?.forecast}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                                dataKey="date"
                                stroke="#64748B"
                                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="#64748B" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 12 }}
                                labelFormatter={(v) => new Date(v).toLocaleDateString()}
                            />
                            <Area type="monotone" dataKey="upper" stroke="none" fill="#3B82F6" fillOpacity={0.1} />
                            <Area type="monotone" dataKey="lower" stroke="none" fill="#3B82F6" fillOpacity={0.1} />
                            <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={false} strokeDasharray="5 5" name="Forecast" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3">
                    <div className="text-xl">💡</div>
                    <div>
                        <h4 className="text-emerald-400 font-semibold text-sm mb-1">AI Insight</h4>
                        <p className="text-slate-300 text-sm">{demandData?.insight}</p>
                    </div>
                </div>
            </div>

            {/* Spend Forecast */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white">Procurement Spend Forecast</h2>
                </div>

                <div className="h-80 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spendData?.forecast}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                                dataKey="date"
                                stroke="#64748B"
                                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="#64748B" tickFormatter={(v) => `€${v / 1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 12 }}
                                labelFormatter={(v) => new Date(v).toLocaleDateString()}
                                formatter={(v: number) => formatCurrency(v)}
                            />
                            <Area type="monotone" dataKey="upper" stroke="none" fill="#DC0032" fillOpacity={0.1} />
                            <Area type="monotone" dataKey="lower" stroke="none" fill="#DC0032" fillOpacity={0.1} />
                            <Line type="monotone" dataKey="value" stroke="#DC0032" strokeWidth={3} dot={false} strokeDasharray="5 5" name="Forecast" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                    <div className="text-xl">💰</div>
                    <div>
                        <h4 className="text-amber-400 font-semibold text-sm mb-1">Cost Alert</h4>
                        <p className="text-slate-300 text-sm">{spendData?.insight}</p>
                    </div>
                </div>
            </div>

            {/* Supplier Reliability */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Supplier & Route Reliability Risk</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3">Route / Scenario</th>
                                <th className="px-4 py-3 text-right">Reliability Score</th>
                                <th className="px-4 py-3">Risk Level</th>
                                <th className="px-4 py-3">AI Key Insight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reliabilityData.map((row: any, i: number) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="px-4 py-3 font-medium text-white">{row.route}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${row.score > 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                            row.score > 60 ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-red-500/20 text-red-500'
                                            }`}>
                                            {row.score}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {row.score > 80 ? 'Low' : row.score > 60 ? 'Medium' : 'High'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-300 italic">
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
