import { createContext, useState, useEffect, useCallback } from 'react'
import { login as loginApi, register as registerApi, getMe } from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.is_admin === true

  // Load user on mount if token exists
  useEffect(() => {
    if (token) {
      getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = useCallback(async (username, password) => {
    const data = await loginApi(username, password)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (username, password, email) => {
    const data = await registerApi(username, password, email)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isAdmin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
