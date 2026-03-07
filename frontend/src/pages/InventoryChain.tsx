import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import ChainOfCustodyTimeline from '../components/inventory-chain/ChainOfCustodyTimeline';
import InventoryMovementMap from '../components/inventory-chain/InventoryMovementMap';
import IntegrityVerifier from '../components/inventory-chain/IntegrityVerifier';
import BlockchainAuditTable from '../components/inventory-chain/BlockchainAuditTable';
import InventoryAlertPanel from '../components/inventory-chain/InventoryAlertPanel';

export default function InventoryChainPage() {
    const { token } = useAuth();
    const [searchId, setSearchId] = useState('');
    const [searchedmovements, setSearchedMovements] = useState<any[]>([]);

    const handleSearch = () => {
        if (!searchId || !token) return;
        fetch(`http://localhost:3000/api/inventory-chain/history/${searchId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSearchedMovements(data);
            })
            .catch(err => console.error(err));
    };

    return (
        <div className="space-y-8 pb-10 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    Chain of Custody
                </h1>
                <p className="text-slate-500 mt-2">
                    Immutable inventory tracking secured by the InventoryTracker Smart Contract.
                </p>
            </div>

            {/* Alerts */}
            <InventoryAlertPanel />

            {/* Top Row: Verifier & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <IntegrityVerifier />

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Track Specific Item</h3>
                    <div className="flex gap-3 mb-4">
                        <input
                            type="text"
                            placeholder="Search Item ID..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-redbull-red/30 transition-all duration-200"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-200"
                        >
                            Trace
                        </button>
                    </div>
                    {searchedmovements.length > 0 ? (
                        <div className="flex-1 overflow-auto max-h-[200px] pr-2">
                            <ChainOfCustodyTimeline movements={searchedmovements} />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                            Enter an Item ID to visualize its journey.
                        </div>
                    )}
                </div>
            </div>

            {/* Map Visualization */}
            {searchedmovements.length > 0 && (
                <InventoryMovementMap movements={searchedmovements} />
            )}

            {/* Full Audit Ledger */}
            <BlockchainAuditTable />
        </div>
    );
}
