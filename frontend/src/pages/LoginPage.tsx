import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password.');
            return;
        }

        setIsLoading(true);
        try {
            await login(username, password);
            navigate('/', { replace: true });
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
                setError(axiosErr.response?.data?.error?.message || 'Invalid credentials');
            } else {
                setError('Network error. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-redbull px-4 relative">
            {/* Subtle background accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-redbull-red/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-redbull-red/3 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-fade-in">
                {/* Red Bull Logo — centered */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/redbull-logo.png"
                            alt="Red Bull"
                            className="h-16 w-auto"
                        />
                    </div>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Supply Chain Intelligence Platform</p>
                </div>

                {/* Login Form Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg transition-shadow duration-300 hover:shadow-xl">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6">Sign in to your account</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2 transition-all duration-300">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-600 mb-1.5">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-redbull-red/30 focus:border-redbull-red/40 transition-all duration-200"
                                placeholder="Enter your username"
                                autoComplete="username"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-redbull-red/30 focus:border-redbull-red/40 transition-all duration-200"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-redbull-red hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 text-xs mt-6">
                        Red Bull Austria Supply Chain &copy; {new Date().getFullYear()}
                    </p>
                </div>

                {/* Demo Credentials Box */}
                <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Demo Credentials Only</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500 font-medium w-14">User:</span>
                            <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-xs">admin</code>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500 font-medium w-14">Pass:</span>
                            <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-xs">admin123</code>
                        </div>
                    </div>
                </div>

                <p className="text-center text-slate-400 text-xs mt-4">
                    Developed by Mohammed Kaif Ahmed — MSc Strategy Management, DCU
                </p>
            </div>
        </div>
    );
}
