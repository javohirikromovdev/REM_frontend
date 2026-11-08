import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { authUrl } from '../lib/returnTo'
import { PageLoader } from './ui'
import { ForbiddenPage } from '../pages/StatusPages'

/** Mehmonni registratsiyaga yuboradi; adminOnly bo'lsa ADMIN bo'lmaganlarga 403 */
export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { status, user } = useAuth()
  const location = useLocation()

  // Auth tekshiruvi tugamaguncha redirect qilmaymiz
  if (status === 'loading') return <PageLoader />
  if (status === 'guest') return <Navigate to={authUrl('register', location.pathname + location.search)} replace />
  if (adminOnly && user?.role !== 'ADMIN') return <ForbiddenPage />
  return <>{children}</>
}
