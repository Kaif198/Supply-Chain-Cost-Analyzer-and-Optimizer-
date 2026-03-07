import { motion } from 'framer-motion';

interface Movement {
    itemId: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
    movementType: string;
    handler: string;
    timestamp: string;
    ipfsHash?: string;
}

interface ChainOfCustodyTimelineProps {
    movements: Movement[];
}

export default function ChainOfCustodyTimeline({ movements }: ChainOfCustodyTimelineProps) {
    if (movements.length === 0) {
        return (
            <div className="p-6 text-slate-400 text-center bg-slate-50 rounded-xl border border-slate-200">
                No blockchain records found for this item.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {movements.map((move, index) => (
                <motion.div
                    key={`${move.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex gap-4"
                >
                    {/* Connector Line */}
                    {index !== movements.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-200" />
                    )}

                    {/* Icon */}
                    <div className="relative z-10 w-10 h-10 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors duration-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 mb-1">
                                    {move.movementType}
                                </span>
                                <h4 className="text-slate-800 font-medium">{move.fromLocation} → {move.toLocation}</h4>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                                {new Date(move.timestamp).toLocaleString()}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                            <div>
                                <p className="mb-0.5">Quantity</p>
                                <p className="text-slate-700 font-medium">{move.quantity} Units</p>
                            </div>
                            <div>
                                <p className="mb-0.5">Handler</p>
                                <p className="text-slate-700 font-mono text-[10px] truncate" title={move.handler}>
                                    {move.handler}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
