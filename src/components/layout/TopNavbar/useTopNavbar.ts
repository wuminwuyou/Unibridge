import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { logoutByTokens } from '../../../api/Auth'
import { getAccessToken, getRefreshToken } from '../../../auth/tokenStorage'
import { useAuth } from '../../../contexts/AuthContext'
import { useTheme } from '../../../contexts/ThemeContext'
import type { AuthStatus, AuthUserRole } from '../../AuthModal'
import { resolveActiveNavByPathname } from './navRoutes'

// 01）顶部导航业务 Hook（useTopNavbar）
/**
 * 函数名：useTopNavbar
 * 功能：聚合顶部导航的主题、路由高亮、登录弹窗、个人空间跳转等状态与事件。
 * 实现方法：
 * - 通过 ThemeContext 提供当前主题与切换能力
 * - 通过 useLocation 计算 activeNavItem
 * - 维护登录弹窗开关与本地“已登录”标记，登录成功后将入口切换为“个人空间”
 * - 根据登录状态决定点击右上入口是打开弹窗还是跳转 /profile
 * 输入：
 * - 无（导航文案列表由调用方通过 TopNavbarProps 传入视图）
 * 输出：
 * - 返回值：TopNavbarModel —— 当前 theme/pathname/activeNavItem 等状态与处理器
 * - 副作用：切换主题会触发全局主题更新；登录成功会更新本地状态
 */
export function useTopNavbar() {
  const { theme, toggleTheme } = useTheme()
  const { isLoggedIn, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activeNavItem = resolveActiveNavByPathname(pathname)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)

  // 02）打开登录弹窗（handleOpenAuthModal）
  const handleOpenAuthModal = (): void => {
    setIsAuthModalOpen(true)
  }

  // 03）关闭登录弹窗（handleCloseAuthModal）
  const handleCloseAuthModal = (): void => {
    setIsAuthModalOpen(false)
  }

  // 04）登录成功回调（handleAuthSuccess）
  /**
   * 函数名：handleAuthSuccess
   * 功能：登录成功后切换为已登录状态并关闭弹窗。
   * 输入：
   * - _userRole：登录角色（暂未使用）
   * - _authStatus：实名/审核状态（暂未使用）
   * 输出：
   * - 返回值：void
   * - 副作用：更新 isAuthenticated 与 isAuthModalOpen
   */
  const handleAuthSuccess = (_userRole: AuthUserRole, _authStatus: AuthStatus): void => {
    setIsAuthModalOpen(false)
  }

  // 05）右上角入口点击（handleAuthEntryClick）
  /**
   * 函数名：handleAuthEntryClick
   * 功能：根据登录状态决定打开登录弹窗或跳转到个人空间。
   * 实现方法：
   * - 未登录：打开 AuthModal
   * - 已登录且当前不在 /profile：跳转个人空间
   * - 已登录且已在 /profile：忽略
   * 输入：无
   * 输出：
   * - 返回值：void
   * - 副作用：更新弹窗状态或触发路由跳转
   */
  const handleAuthEntryClick = (): void => {
    if (!isLoggedIn) {
      handleOpenAuthModal()
      return
    }

    if (pathname !== '/profile') {
      navigate('/profile')
    }
  }

  // 06）消息通知点击处理函数（handleNotifyClick）
  /**
   * 函数名：handleNotifyClick
   * 功能：点击顶部导航“消息通知”后，以新标签页打开即时通讯页面。
   * 实现方法：
   * - 固定目标路由为 /messages
   * - 使用 window.open 新开标签页，避免打断当前页面浏览
   * - 启用 noopener,noreferrer 减少新窗口权限与来源暴露
   * 输入：
   * - 无
   * 输出：
   * - 返回值：void
   * - 副作用：浏览器打开新标签页
   */
  const handleNotifyClick = (): void => {
    if (pathname.startsWith('/messages')) {
      return
    }

    window.open('/messages', '_blank', 'noopener,noreferrer')
  }

  // 07）退出登录处理（handleLogout）
  /**
   * 函数名：handleLogout
   * 功能：执行用户退出登录，调用后端登出接口并在结束后清理本地状态、刷新页面。
   * 实现方法：
   * - 动态读取本地 access_token / refresh_token 组装登出请求体
   * - 当双 token 齐全时调用后端 /auth/logout 接口销毁服务端会话
   * - 接口成功视为正常登出；接口异常仅记录日志，避免按钮“无响应”假象
   * - 不论后端成功失败，最终都清理本地登录态并执行浏览器刷新（清空内存）
   * 输入：无
   * 输出：
   * - 返回值：void
   * - 副作用：网络请求、清理 localStorage、触发页面刷新
   */
  const handleLogout = (): void => {
    void (async () => {
      const currentAccessToken = getAccessToken()
      const currentRefreshToken = getRefreshToken()

      try {
        if (currentAccessToken && currentRefreshToken) {
          await logoutByTokens({
            accessToken: currentAccessToken,
            refreshToken: currentRefreshToken,
          })
        }
      } catch (logoutError) {
        console.warn('退出登录接口调用失败，将继续清理本地登录态：', logoutError)
      } finally {
        logout()
        window.location.reload()
      }
    })()
  }

  return {
    theme,
    toggleTheme,
    pathname,
    activeNavItem,
    isAuthModalOpen,
    isAuthenticated: isLoggedIn,
    handleCloseAuthModal,
    handleAuthSuccess,
    handleAuthEntryClick,
    handleNotifyClick,
    handleLogout,
  }
}

// 08）顶部导航业务模型类型（TopNavbarModel）
export type TopNavbarModel = ReturnType<typeof useTopNavbar>
