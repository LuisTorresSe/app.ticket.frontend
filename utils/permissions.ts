// src/utils/permissions.ts
import { useAuthStore } from '@/store/authStore'

export function can(permission: string): boolean {
    const user = useAuthStore.getState().user
    return user?.permissions.includes(permission) ?? false
}
