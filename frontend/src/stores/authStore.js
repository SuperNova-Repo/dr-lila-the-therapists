import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      login: (token, user) => {
        set({ token, user, isAuthenticated: true })
        localStorage.setItem('token', token)
      },
      
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        localStorage.removeItem('token')
      },
      
      updateUser: (user) => {
        set({ user })
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)