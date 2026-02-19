import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
    // The backend authentication URL - accurately marking port 3000
    // Use nginx-proxy or direct path-based routing
    const AUTH_URL = `/api/profile/auth`;

    const handleLogin = (provider: string) => {
        window.location.href = `${AUTH_URL}/${provider}`;
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
            </div>

            {/* Main Content Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-gray-800 border border-gray-700 rounded-3xl p-10 shadow-2xl">

                    {/* CareerGini Branding */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <h2 className="text-3xl font-bold text-white">CareerGini</h2>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-3">
                            Welcome
                        </h1>
                        <p className="text-gray-300 text-base">
                            Sign in to access your AI Career Assistant
                        </p>
                    </div>

                    {/* Login Button */}
                    <div className="space-y-6">
                        <button
                            onClick={() => handleLogin('google')}
                            className="w-full group relative flex items-center justify-center gap-4 px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                            <span className="text-gray-900">Continue with Google</span>
                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-6 text-gray-500" />
                        </button>

                        {/* Trust Badge */}
                        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-700 border border-gray-600 mt-6">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-white font-medium">Secure & Encrypted Login</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 pt-6 border-t border-gray-700 text-center">
                        <p className="text-xs text-gray-400">
                            By continuing, you verify that you are at least 18 years old and agree to our{' '}
                            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors underline">
                                Terms of Service
                            </a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
