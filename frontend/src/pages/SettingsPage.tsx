import { useAuth } from '../hooks/useAuth';

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-slate-400 text-sm mt-1">
                    Account information and application settings
                </p>
            </div>

            {/* Profile Card */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                    Profile
                </h2>

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-redbull-red/20 rounded-2xl flex items-center justify-center">
                        <span className="text-redbull-red font-bold text-2xl">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div>
                        <p className="text-white font-semibold text-lg">{user?.username}</p>
                        <p className="text-slate-400 text-sm">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <InfoRow label="User ID" value={user?.id || '—'} />
                    <InfoRow label="Role" value={user?.role || '—'} />
                    <InfoRow label="Username" value={user?.username || '—'} />
                    <InfoRow label="Email" value={user?.email || '—'} />
                </div>
            </div>

            {/* Application Info */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                    Application
                </h2>
                <div className="space-y-3">
                    <InfoRow label="Platform" value="Red Bull Austria Supply Chain Intelligence" />
                    <InfoRow label="Version" value="1.0.0" />
                    <InfoRow label="Environment" value="Development" />
                    <InfoRow label="API" value={window.location.origin + '/api'} />
                </div>
            </div>

            {/* System Status */}
            <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                    System Status
                </h2>
                <div className="space-y-3">
                    <StatusRow label="Frontend" status="online" />
                    <StatusRow label="Backend API" status="online" />
                    <StatusRow label="Database (Neon)" status="online" />
                    <StatusRow label="Cache (Redis)" status="optional" />
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-sm text-white font-medium">{value}</span>
        </div>
    );
}

function StatusRow({ label, status }: { label: string; status: 'online' | 'offline' | 'optional' }) {
    const colors = {
        online: 'bg-emerald-500',
        offline: 'bg-red-500',
        optional: 'bg-amber-500',
    };
    const labels = {
        online: 'Online',
        offline: 'Offline',
        optional: 'Optional',
    };

    return (
        <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <span className="text-sm text-slate-400">{label}</span>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
                <span className="text-sm text-white">{labels[status]}</span>
            </div>
        </div>
    );
}
