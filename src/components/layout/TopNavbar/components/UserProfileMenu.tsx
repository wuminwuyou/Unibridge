import { useEffect, useRef, useState } from 'react'
import { ChevronRight, LogOut } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import LevelBadge from '../../../common/LevelBadge'
import {
  currentUser,
  userMenuItems,
  userStatTabMap,
  userStats,
  verifiedBadgeIcon as VerifiedBadgeIcon,
} from '../../../../data/currentUserData'

// 01）用户头像悬浮菜单常量
const CLOSE_TIMER_DELAY_MS = 180
const PROFILE_PATH = '/profile'

// 02）用户头像悬浮菜单参数（UserProfileMenuProps）
interface UserProfileMenuProps {
  onLogout: () => void
}

// 02）用户头像悬浮菜单组件（UserProfileMenu）
/**
 * 函数名：UserProfileMenu
 * 功能：顶部导航右侧的"已登录用户"入口：渲染头像按钮 + 悬停展开的功能面板
 *      （昵称 / 等级 / 认证主体 / 统计入口 / 菜单 / 退出登录）。
 * 实现方法：
 * - 通过 mouseEnter/mouseLeave 维护展开状态，离开时使用 180ms 延迟，便于跨区域移动
 * - 头像按钮点击时若当前不在 /profile，则在新标签页打开个人空间
 * - 三个统计快捷入口通过 userStatTabMap 映射到 /profile?tab=xxx
 * - 复用全局 LevelBadge 渲染能力等级标识
 * 输入：
 * - 无（用户数据来自 src/data/currentUserData.ts，登录态接入后可改为 props）
 * 输出：
 * - 返回值：JSX.Element，头像按钮 + 悬浮面板
 * - 副作用：组件内部 state 与 window.open 跳转
 */
function UserProfileMenu({ onLogout }: UserProfileMenuProps) {
  const [isUserPanelOpen, setIsUserPanelOpen] = useState<boolean>(false)
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)
  const closeTimerRef = useRef<number | null>(null)
  const location = useLocation()

  // 03）清理延迟关闭定时器（clearCloseTimer）
  const clearCloseTimer = (): void => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  // 04）组件卸载清理副作用（useEffect）
  useEffect(() => {
    return () => {
      clearCloseTimer()
    }
  }, [])

  // 05）鼠标移入处理（handleUserMenuMouseEnter）
  const handleUserMenuMouseEnter = (): void => {
    clearCloseTimer()
    setIsUserPanelOpen(true)
  }

  // 06）鼠标移出处理（handleUserMenuMouseLeave）
  /**
   * 函数名：handleUserMenuMouseLeave
   * 功能：移出区域时延迟关闭面板，避免跨区域移动直接收起；退出登录加载中保持面板展开。
   */
  const handleUserMenuMouseLeave = (): void => {
    if (isLoggingOut) {
      return
    }
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setIsUserPanelOpen(false)
      closeTimerRef.current = null
    }, CLOSE_TIMER_DELAY_MS)
  }

  // 07）头像按钮点击（handleUserButtonClick）
  /**
   * 函数名：handleUserButtonClick
   * 功能：点击头像时优先在新标签页打开个人空间；若已在个人空间，则切换面板开关。
   */
  const handleUserButtonClick = (): void => {
    clearCloseTimer()
    if (location.pathname !== PROFILE_PATH) {
      window.open(PROFILE_PATH, '_blank', 'noopener,noreferrer')
      return
    }

    setIsUserPanelOpen((previousState) => !previousState)
  }

  // 08）快捷统计入口点击（handleQuickEntryClick）
  /**
   * 函数名：handleQuickEntryClick
   * 功能：根据入口名称跳转 /profile?tab=目标Tab，跳转后关闭面板。
   * 输入：
   * - entryLabel：快捷入口名称（"动态" / "项目" / "笔记"）
   * 输出：
   * - 返回值：void
   * - 副作用：触发 window.open 与 state 更新
   */
  const handleQuickEntryClick = (entryLabel: string): void => {
    const targetTab = userStatTabMap[entryLabel] ?? '主页'

    window.open(`${PROFILE_PATH}?tab=${encodeURIComponent(targetTab)}`, '_blank', 'noopener,noreferrer')
    setIsUserPanelOpen(false)
  }

  // 09）退出登录点击处理（handleLogoutClick）
  /**
   * 函数名：handleLogoutClick
   * 功能：点击"退出登录"后进入加载态、保持面板展开并触发父级退出登录逻辑。
   * 实现方法：
   * - 防止重复点击：加载中直接忽略
   * - 清理面板自动关闭计时器，保持展开以便用户看到"正在退出登录…"
   * - 标记 isLoggingOut 进入加载态，由按钮文案与禁用状态体现
   * - 调用父级 onLogout 执行登出与刷新逻辑；页面刷新后组件销毁，无需重置状态
   * 输入：无
   * 输出：
   * - 返回值：void
   * - 副作用：更新面板/加载状态并执行 onLogout
   */
  const handleLogoutClick = (): void => {
    if (isLoggingOut) {
      return
    }
    clearCloseTimer()
    setIsLoggingOut(true)
    onLogout()
  }

  return (
    <div
      className={`user-menu ${isUserPanelOpen || isLoggingOut ? 'is-open' : ''}`}
      onMouseEnter={handleUserMenuMouseEnter}
      onMouseLeave={handleUserMenuMouseLeave}
    >
      <button className="user-button" type="button" aria-label="用户菜单" onClick={handleUserButtonClick}>
        <span className="user-avatar" aria-hidden="true">
          {currentUser.avatarText}
        </span>
        <span className="user-button__name">{currentUser.nickname}</span>
      </button>

      <div className="user-panel" role="menu" aria-label="用户功能面板">
        <div className="user-panel__header">
          <div className="user-panel__name-row">
            <strong>{currentUser.nickname}</strong>
            <LevelBadge level={currentUser.level} className="user-level-badge" />
          </div>
          <span className="user-verify-badge">
            <VerifiedBadgeIcon size={16} strokeWidth={2} aria-hidden="true" />
            {currentUser.verifiedOrganization}
          </span>
        </div>

        <div className="user-panel__stats">
          {userStats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              className="user-stat-item user-stat-button"
              onClick={() => handleQuickEntryClick(stat.label)}
              aria-label={`进入${stat.label}`}
            >
              <span className="user-stat-item__icon" aria-hidden="true">
                <stat.icon size={24} strokeWidth={2} />
              </span>
              <span>{stat.label}</span>
            </button>
          ))}
        </div>

        <ul className="user-panel__menu-list">
          {userMenuItems.map((item) => (
            <li key={item.label}>
              <button type="button" className="user-menu-item">
                <span className="user-menu-item__left">
                  <span className="user-menu-item__icon" aria-hidden="true">
                    <item.icon size={24} strokeWidth={2} />
                  </span>
                  <span>{item.label}</span>
                </span>
                <span className="user-menu-item__arrow" aria-hidden="true">
                  <ChevronRight size={24} strokeWidth={2} />
                </span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="user-logout-button"
          onClick={handleLogoutClick}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
        >
          <span className="user-logout-button__icon" aria-hidden="true">
            <LogOut size={24} strokeWidth={2} />
          </span>
          <span>{isLoggingOut ? '正在退出登录…' : '退出登录'}</span>
        </button>
      </div>
    </div>
  )
}

export default UserProfileMenu
