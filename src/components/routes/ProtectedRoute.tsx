import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken } from '../../auth/tokenStorage'
import { useAuth } from '../../contexts/AuthContext'

// 01）受保护路由参数类型定义（ProtectedRouteProps）
interface ProtectedRouteProps {
  children: ReactElement
}

// 02）受保护路由组件（ProtectedRoute）
/**
 * 函数名：ProtectedRoute
 * 功能：为私有页面提供登录拦截，未登录则重定向到 /login。
 * 实现方法：
 * - 优先读取 AuthContext 的 isLoggedIn/token 状态
 * - 兜底读取 localStorage access_token，避免状态未同步时误判
 * - 未命中 token 时使用 Navigate replace 重定向到登录页
 * 输入：
 * - children：需要受保护的页面元素
 * 输出：
 * - 返回值：children 或 <Navigate />
 * - 副作用：可能触发路由跳转
 */
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, token, isHydrated } = useAuth()
  const currentLocation = useLocation()
  const cachedAccessToken = getAccessToken()

  if (!isHydrated) {
    return null
  }

  if (!isLoggedIn && !token && !cachedAccessToken) {
    return <Navigate to="/login" replace state={{ from: currentLocation.pathname }} />
  }

  return children
}

export default ProtectedRoute
