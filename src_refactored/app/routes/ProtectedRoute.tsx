// 01）认证上下文路由守卫（ProtectedRoute）
import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken } from '../../shared/lib/tokenStorage'
import { useAuth } from '../../shared/hooks/useAuth'

interface ProtectedRouteProps { children: ReactElement }

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, token, isHydrated } = useAuth()
  const currentLocation = useLocation()
  const cachedAccessToken = getAccessToken()

  if (!isHydrated) return null
  if (!isLoggedIn && !token && !cachedAccessToken) {
    return <Navigate to="/login" replace state={{ from: currentLocation.pathname }} />
  }
  return children
}

export default ProtectedRoute
