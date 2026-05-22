import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../contexts/AuthContext'
import HomePage from './HomePage/index.tsx'

// 01）登录页代理组件（LoginPage）
/**
 * 函数名：resolveRedirectPath
 * 功能：解析登录后或关闭弹窗后的回跳地址。
 * 实现方法：
 * - 优先读取路由 state.from
 * - 若 from 不存在则默认回到首页
 * 输入：
 * - routeState：路由 state 对象
 * 输出：
 * - 返回值：回跳路径字符串
 * - 副作用：无
 */
function resolveRedirectPath(routeState: unknown): string {
  if (routeState && typeof routeState === 'object' && 'from' in routeState) {
    const routeFrom = (routeState as { from?: unknown }).from
    if (typeof routeFrom === 'string' && routeFrom.trim()) {
      return routeFrom
    }
  }
  return '/'
}

// 02）登录页路由组件（LoginPage）
/**
 * 函数名：LoginPage
 * 功能：提供 /login 路由专用登录入口，并直接拉起现有 AuthModal。
 * 实现方法：
 * - 复用 HomePage 作为背景页面
 * - 进入 /login 时固定展示 AuthModal（open=true）
 * - 登录成功或主动关闭时，回跳到来源页或首页
 * 输入：无
 * 输出：
 * - 返回值：HomePage 页面 JSX
 * - 副作用：触发导航跳转
 */
function LoginPage() {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const redirectPath = resolveRedirectPath(location.state)

  if (isLoggedIn) {
    return <Navigate to={redirectPath} replace />
  }

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
