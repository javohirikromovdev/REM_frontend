import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ApiError, api, setUnauthorizedHandler, tokenStorage } from '../lib/api'
import type { User } from '../lib/types'
import { useToast } from './ToastContext'

type AuthStatus = 'loading' | 'authenticated' | 'guest'

interface AuthValue {
  user: User | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'loading' : 'guest'))
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { t } = useTranslation()

  const locationRef = useRef(location)
  locationRef.current = location

  useEffect(() => {
    if (!tokenStorage.get()) return
    let cancelled = false
    api.auth
      .me()
      .then((me) => {
        if (cancelled) return
        setUserState(me)
        setStatus('authenticated')
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) tokenStorage.clear()
        setStatus('guest')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUserState(null)
    setStatus('guest')
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
      const loc = locationRef.current
      const returnTo = loc.pathname + loc.search
      toast(t('auth.sessionExpired'), 'info')
      navigate(`/login?${new URLSearchParams({ returnTo, reason: 'auth', expired: '1' })}`, { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession, navigate, toast, t])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.auth.login({ email, password })
      queryClient.clear()
      tokenStorage.set(res.accessToken)
      setUserState(res.user)
      setStatus('authenticated')
      return res.user
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    clearSession()
    navigate('/')
  }, [clearSession, navigate])

  return (
    <AuthContext.Provider value={{ user, status, login, logout, setUser: setUserState }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
