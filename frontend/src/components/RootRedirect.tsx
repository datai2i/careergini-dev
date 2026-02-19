import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RootRedirect: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated) {
                // Authenticated users go to home dashboard
                navigate('/home');
            } else {
                // Unauthenticated users go to login
                navigate('/login');
            }
        }
    }, [isAuthenticated, loading, navigate]);

    // Show nothing while redirecting
    return null;
};

