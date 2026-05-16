import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string | null
  name: string | null
  email: string | null
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
}

function setAuthCookie(token: string | null) {
  if (typeof document === 'undefined') return

  if (token) {
    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    return
  }

  document.cookie = 'auth_token=; path=/; max-age=0; samesite=lax'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token)
        }
        setAuthCookie(token)
        set({ token, user })
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
        setAuthCookie(null)
        set({ token: null, user: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
