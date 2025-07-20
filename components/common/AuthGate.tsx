// src/components/common/AuthGate.tsx
import React from 'react'
import { useAuthStore } from '@/store/authStore'
import LoadingScreen from './LoadingScreen'
import LoginPage from '../auth/LoginPage'
import MainLayout from './MainLayout'

const AuthGate: React.FC = () => {
    const { user, loading } = useAuthStore()


    if (loading) {
        return <LoadingScreen />
    }

    if (!user) {
        return <LoginPage />
    }

    return <MainLayout />
}

export default AuthGate
