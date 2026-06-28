// 01）登录页路由组件（LoginPage）
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../shared/hooks/useAuth'
import AuthModal from '../../../widgets/auth-modal'
import HomePage from '../../home'

function resolveRedirectPath(routeState: unknown): string {
  if (routeState && typeof routeState === 'object' && 'from' in routeState) {
    const routeFrom = (routeState as { from?: unknown }).from
    if (typeof routeFrom === 'string' && routeFrom.trim()) return routeFrom
  }
  return '/'
}

function LoginPage() {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const redirectPath = resolveRedirectPath(location.state)

  if (isLoggedIn) return <Navigate to={redirectPath} replace />

  return (
    <>
      <HomePage />
      <AuthModal
        open
        onClose={() => navigate(redirectPath, { replace: true })}
        onSuccess={() => navigate(redirectPath, { replace: true })}
      />
    </>
  )
}

export default LoginPage
