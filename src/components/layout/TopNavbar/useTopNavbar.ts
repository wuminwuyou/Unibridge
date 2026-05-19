import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activeNavItem = resolveActiveNavByPathname(pathname)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

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
    setIsAuthenticated(true)
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
    if (!isAuthenticated) {
      handleOpenAuthModal()
      return
    }

    if (pathname !== '/profile') {
      navigate('/profile')
    }
  }

  return {
    theme,
    toggleTheme,
    pathname,
    activeNavItem,
    isAuthModalOpen,
    isAuthenticated,
    handleCloseAuthModal,
    handleAuthSuccess,
    handleAuthEntryClick,
  }
}

// 06）顶部导航业务模型类型（TopNavbarModel）
export type TopNavbarModel = ReturnType<typeof useTopNavbar>
