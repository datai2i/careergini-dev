import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = React.useState<string | null>(null);

    useEffect(() => {
        const handleLogin = async () => {
            const token = searchParams.get('token');
            if (token) {
                try {
                    await login(token);
                    navigate('/onboarding');
                } catch (error: any) {
                    console.error('Login failed during callback:', error);
                    setError(error.message || 'Authentication failed');
                }
            } else {
                navigate('/login');
            }
        };

        handleLogin();
    }, [searchParams, login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Authenticating...
                </h2>
            </div>
        </div>
    );
};
