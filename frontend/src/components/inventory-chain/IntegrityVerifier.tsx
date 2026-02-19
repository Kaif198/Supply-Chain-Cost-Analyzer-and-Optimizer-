import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntegrityVerifier() {
    const [itemId, setItemId] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'VERIFYING' | 'VERIFIED' | 'TAMPERED'>('IDLE');

    const handleVerify = () => {
        if (!itemId) return;
        setStatus('VERIFYING');

        // Simulate verification delay (in real app, this calls backend/contract)
        setTimeout(() => {
            // Demo logic: If ID starts with "FAIL", it's tampered. Else Verified.
            if (itemId.toUpperCase().startsWith('FAIL')) {
                setStatus('TAMPERED');
            } else {
                setStatus('VERIFIED');
            }
        }, 2000);
    };

    return (
        <div className="bg-redbull-dark-blue border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-2xl">🛡️</span> Blockchain Integrity Check
            </h3>
            <p className="text-slate-400 text-sm mb-6">
                Enter an Item ID to verify its complete chain of custody against the immutable ledger.
            </p>

            <div className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={itemId}
                    onChange={(e) => {
                        setItemId(e.target.value);
                        setStatus('IDLE');
                    }}
                    placeholder="Enter Item ID (e.g. ITEM-12345678)"
                    className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-redbull-red transition-colors font-mono"
                />
                <button
                    onClick={handleVerify}
                    disabled={!itemId || status === 'VERIFYING'}
                    className="bg-redbull-red hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                    {status === 'VERIFYING' ? 'Checking...' : 'Verify'}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {status === 'VERIFIED' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-green-400 font-bold text-lg">Integrity Verified</h4>
                            <p className="text-green-500/80 text-sm">
                                Blockchain hash matches database records. Chain of custody is complete and valid.
                            </p>
                        </div>
                    </motion.div>
                )}

                {status === 'TAMPERED' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-red-400 font-bold text-lg">Tampering Detected</h4>
                            <p className="text-red-500/80 text-sm">
                                Hash mismatch found at Block #1024. The record has been altered or is missing a step.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
