import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../types'
import users from '../data/users.json'

type AuthContextType = {
  user: User | null
  login: (username: string, password: string) => Promise<User | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('ttm_user')
      return raw ? (JSON.parse(raw) as User) : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem('ttm_user', JSON.stringify(user))
    else localStorage.removeItem('ttm_user')
  }, [user])

  const login = async (username: string, password: string) => {
    try {
      console.log('🔧 AuthContext login called with:', { username, password })
      
      // Import API service dynamically to avoid circular dependencies
      const apiModule = await import('../services/api')
      const api = apiModule.default
      
      // Call backend API for login (role comes from database)
      const userObj = await api.login(username, password)
      
      if (!userObj) {
        console.log('❌ Login failed')
        return null
      }

      console.log('✅ User logged in:', userObj)
      setUser(userObj)
      return userObj
    } catch (error) {
      console.error('❌ AuthContext login error:', error)
      return null
    }
  }

  const logout = async () => {
    try {
      // Call backend logout endpoint
      const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true'
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '' // Empty because endpoints include /api
      
      if (!USE_MOCK) {
        await fetch(`${API_BASE_URL}/api/auth.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'logout' }),
        }).catch(() => {
          // Ignore errors on logout
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
