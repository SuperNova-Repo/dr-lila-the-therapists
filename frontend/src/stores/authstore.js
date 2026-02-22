import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      login: (token, user) => {
        console.log('🔐 AuthStore: Storing token & user', { token: token?.substring(0, 20) + '...', user })
        
        // Speichere im Store
        set({ 
          token, 
          user, 
          isAuthenticated: true 
        })
        
        // Auch manuell in localStorage (Backup)
        localStorage.setItem('auth-token', token)
        localStorage.setItem('auth-user', JSON.stringify(user))
        
        console.log('✅ AuthStore: Saved. isAuthenticated =', get().isAuthenticated)
      },
      
      logout: () => {
        console.log('👋 AuthStore: Logging out')
        set({ token: null, user: null, isAuthenticated: false })
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
        localStorage.removeItem('auth-storage')
      },
      
      updateUser: (user) => {
        set({ user })
        localStorage.setItem('auth-user', JSON.stringify(user))
      },
      
      // Helper: Token holen
      getToken: () => {
        const storeToken = get().token
        const localToken = localStorage.getItem('auth-token')
        return storeToken || localToken
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
