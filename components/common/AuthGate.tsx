import React from 'react';
import { useAppContext } from '../../context/AppContext';
import LoadingScreen from './LoadingScreen';
import LoginPage from '../auth/LoginPage';
import MainLayout from './MainLayout';
// import MainLayout from './MainLayout';

const AuthGate: React.FC = () => {
    const { isAuthenticated, loading } = useAppContext();

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    if (loading.initialLoad) {
        return <LoadingScreen />;
    }

    return <MainLayout />;
};

export default AuthGate; 