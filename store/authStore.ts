// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type User = {
    userId: string
    email: string
    fullName: string
    roles: string
    permissions: string[]
}

type AuthState = {
    user: User | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<boolean>
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            loading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ loading: true, error: null })

                try {
                    const response = await fetch('http://localhost:8080/api/v1/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    })

                    if (!response.ok) throw new Error('Credenciales inválidas')

                    const json = await response.json()

                    if (!json.success || !json.data) throw new Error('Respuesta inválida del servidor')

                    const user: User = {
                        userId: json.data.userId,
                        email: json.data.email,
                        fullName: json.data.fullName,
                        roles: json.data.roles,
                        permissions: json.data.permissions,
                    }

                    set({ user, loading: false })
                    return true
                } catch (error: unknown) {
                    const errorMessage =
                        error instanceof Error ? error.message : 'Ocurrió un error inesperado'
                    set({ error: errorMessage, loading: false })
                    return false
                }
            },

            logout: () => {
                set({ user: null })
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
)
