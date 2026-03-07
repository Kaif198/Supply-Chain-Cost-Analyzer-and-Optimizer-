import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AuditRecord {
    id: string;
    itemId: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
    movementType: string;
    txHash: string;
    blockNumber: number;
    createdAt: string;
}

export default function BlockchainAuditTable() {
    const { token } = useAuth();
    const [records, setRecords] = useState<AuditRecord[]>([]);

    useEffect(() => {
        if (token) {
            fetch('http://localhost:3000/api/inventory-chain/audit-log', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setRecords(data);
                })
                .catch(err => console.error(err));
        }
    }, [token]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Live Blockchain Ledger</h3>
                <span className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Live Sync
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Item ID</th>
                            <th className="px-6 py-4">Movement</th>
                            <th className="px-6 py-4">Quantity</th>
                            <th className="px-6 py-4">Transaction Hash</th>
                            <th className="px-6 py-4">Block #</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                                    No transactions recorded yet. Create a delivery to generate blockchain records.
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => (
                                <tr key={record.id} className="text-sm text-slate-600 hover:bg-slate-50 transition-colors duration-150">
                                    <td className="px-6 py-4 font-mono text-xs">{record.itemId}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-800 font-medium">{record.movementType}</span>
                                            <span className="text-xs text-slate-400">{record.fromLocation.slice(0, 8)}... → {record.toLocation.slice(0, 8)}...</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{record.quantity}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-blue-600 truncate max-w-[150px]">
                                        {record.txHash}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{record.blockNumber}</td>
                                    <td className="px-6 py-4 text-xs text-slate-400">
                                        {new Date(record.createdAt).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-600 border border-emerald-200">
                                            Confirmed
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
