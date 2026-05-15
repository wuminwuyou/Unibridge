import { useEffect, useRef, useState } from 'react'
import {
  BadgeCheck,
  BookOpenText,
  ChevronRight,
  FolderKanban,
  LogOut,
  MessageCircleMore,
  Send,
  Star,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import LevelBadge from '../common/LevelBadge'

// 02）用户统计项类型定义（UserStatItem）
interface UserStatItem {
  label: string
  icon: LucideIcon
}

// 03）用户菜单项类型定义（UserMenuItem）
interface UserMenuItem {
  label: string
  icon: LucideIcon
}

// 04）当前用户静态信息（currentUser）
const currentUser = {
  nickname: '无名_无忧',
  verifiedOrganization: '深圳技术大学',
  level: 'SSR' as const,
  avatarText: '无',
}

// 05）用户统计数据（userStats）
const userStats: UserStatItem[] = [
  { label: '动态', icon: MessageCircleMore },
  { label: '项目', icon: FolderKanban },
  { label: '笔记', icon: BookOpenText },
]

// 06）用户菜单数据（userMenuItems）
const userMenuItems: UserMenuItem[] = [
  { label: '个人中心', icon: UserRound },
  { label: '发布管理', icon: Send },
  { label: '我的收藏', icon: Star },
]

// 07）用户头像悬浮菜单组件（UserProfileMenu）
/**
 * 函数名：UserProfileMenu
 * 功能：渲染顶部用户头像按钮及悬浮展开面板，展示用户信息和快捷功能入口。
 * 实现方法：
 * - 通过 hover 事件维护面板展开状态，实现平滑展开/收起动画
 * - 渲染昵称、认证主体、能力等级、统计项与菜单项
 * - 复用全局 LevelBadge 组件统一能力等级样式与色板
 * 输入：
 * - 无（当前使用静态用户数据，后续可替换为 props）
 * 输出：
 * - 返回值：JSX.Element，头像按钮及悬浮面板结构
 * - 副作用：更新组件内部状态以控制展开动画
 */
function UserProfileMenu() {
  const [isUserPanelOpen, setIsUserPanelOpen] = useState<boolean>(false)
  const closeTimerRef = useRef<number | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // 08）清理关闭定时器函数（clearCloseTimer）
  /**
   * 函数名：clearCloseTimer
   * 功能：清除已存在的延迟关闭定时器，避免面板被误关闭。
   * 实现方法：
   * - 判断当前是否存在有效定时器
   * - 使用 window.clearTimeout 清理并重置 ref
   * 输入：
   * - 无
   * 输出：
   * - 返回值：void
   * - 副作用：清理浏览器定时器
   */
  const clearCloseTimer = (): void => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  // 09）组件卸载清理副作用（useEffect）
  useEffect(() => {
    return () => {
      clearCloseTimer()
    }
  }, [])

  // 10）头像区域进入处理函数（handleUserMenuMouseEnter）
  /**
   * 函数名：handleUserMenuMouseEnter
   * 功能：当鼠标移入用户菜单区域时，立即展开面板并阻断关闭流程。
   * 实现方法：
   * - 先清理可能存在的延迟关闭定时器
   * - 将面板可见状态设置为 true 触发展开动画
   * 输入：
   * - 无
   * 输出：
   * - 返回值：void
   * - 副作用：更新组件状态
   */
  const handleUserMenuMouseEnter = (): void => {
    clearCloseTimer()
    setIsUserPanelOpen(true)
  }

  // 11）头像区域离开处理函数（handleUserMenuMouseLeave）
  /**
   * 函数名：handleUserMenuMouseLeave
   * 功能：当鼠标离开用户菜单区域时，延迟收起面板以支持跨区域移动。
   * 实现方法：
   * - 先清理旧的关闭定时器，避免重复触发
   * - 启动 180ms 定时器后再关闭面板
   * - 给予鼠标从头像移动到弹窗内部的缓冲时间
   * 输入：
   * - 无
   * 输出：
   * - 返回值：void
   * - 副作用：更新组件状态
   */
  const handleUserMenuMouseLeave = (): void => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setIsUserPanelOpen(false)
      closeTimerRef.current = null
    }, 180)
  }

  // 12）头像按钮点击处理函数（handleUserButtonClick）
  /**
   * 函数名：handleUserButtonClick
   * 功能：处理头像按钮点击行为，优先跳转到个人空间页面。
   * 实现方法：
   * - 清理延迟关闭定时器，避免与点击动作冲突
   * - 若当前不在个人空间页则直接跳转到 /profile
   * - 若已在个人空间页，保留弹窗开关行为便于继续使用菜单
   * 输入：
   * - 无
   * 输出：
   * - 返回值：void
   * - 副作用：更新路由或组件状态
   */
  const handleUserButtonClick = (): void => {
    clearCloseTimer()
    if (location.pathname !== '/profile') {
      navigate('/profile')
      return
    }

    setIsUserPanelOpen((previousState) => !previousState)
  }

  // 13）快捷入口点击处理函数（handleQuickEntryClick）
  /**
   * 函数名：handleQuickEntryClick
   * 功能：处理“动态/项目/笔记”快捷入口点击事件，为后续接入路由跳转预留统一入口。
   * 实现方法：
   * - 接收快捷入口名称参数
   * - 当前阶段不跳转，仅保留函数作为交互锚点
   * - 后续可在此接入 navigate 或埋点逻辑
   * 输入：
   * - entryLabel：快捷入口名称
   * 输出：
   * - 返回值：void
   * - 副作用：无
   */
  const handleQuickEntryClick = (_entryLabel: string): void => {}

  return (
    <div
      className={`user-menu ${isUserPanelOpen ? 'is-open' : ''}`}
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
            <BadgeCheck size={16} strokeWidth={2} aria-hidden="true" />
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

        <button type="button" className="user-logout-button">
          <span className="user-logout-button__icon" aria-hidden="true">
            <LogOut size={24} strokeWidth={2} />
          </span>
          <span>退出登录</span>
        </button>
      </div>
    </div>
  )
}

export default UserProfileMenu
