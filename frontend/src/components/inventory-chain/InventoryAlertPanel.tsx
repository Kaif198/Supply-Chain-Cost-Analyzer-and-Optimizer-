import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface Alert {
    id: string;
    itemId: string;
    alertType: string;
    description: string;
    createdAt: string;
}

export default function InventoryAlertPanel() {
    const { token } = useAuth();
    const [alerts, setAlerts] = useState<Alert[]>([]);

    useEffect(() => {
        if (token) {
            fetch('http://localhost:3000/api/inventory-chain/alerts', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setAlerts(data);
                })
                .catch(err => console.error(err));
        }
    }, [token]);

    if (alerts.length === 0) return null;

    return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
            <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                <span className="animate-pulse">⚠️</span> Active Alerts ({alerts.length})
            </h3>
            <div className="space-y-3">
                {alerts.map(alert => (
                    <div key={alert.id} className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <div className="flex justify-between">
                            <span className="font-bold text-red-200 text-sm">{alert.alertType}</span>
                            <span className="text-xs text-red-400">{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-red-300 mt-1">{alert.description}</p>
                        <div className="mt-2 text-xs font-mono text-red-400/80">Item: {alert.itemId}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
