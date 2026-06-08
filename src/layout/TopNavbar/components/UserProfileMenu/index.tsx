import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, LogOut } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import LevelBadge from '../../../../components/common/LevelBadge'
import type { LevelCode } from '../../../../types/level'
import { useAuth } from '../../../../contexts/AuthContext'
import { useProfileMenu } from '../../../../contexts/ProfileMenuContext'
import { currentUser as fallbackCurrentUser } from '../../../../data/currentUserData'
import VerifiedOrgModal, { VerifiedOrgButton } from '../../../../components/common/VerifiedOrgModal'
import { isOrganizationAdminRole, resolveSessionEntityCode } from '../../../../auth/organizationSession'
import { isProfileSpacePathname } from '../../../../pages/ProfileSpace/profileTabRouting'
import {
  buildOrganizationSpacePath,
  extractEntityCodeFromPathname,
  isOrganizationSpacePathname,
} from '../../../../pages/ProfileSpace/variants/OrganizationView/organizationTabRouting'
import {
  buildDefaultStats,
  buildOrganizationDefaultMenuItems,
  buildPersonalDefaultMenuItems,
  resolveProfileMenuStatPath,
  type UserMenuViewItem,
  type UserStatViewItem,
} from './profileMenuViewUtils'

// 01）用户头像悬浮菜单常量
const CLOSE_TIMER_DELAY_MS = 180
const PROFILE_PATH = '/profile'

// 02）用户头像悬浮菜单参数（UserProfileMenuProps）
interface UserProfileMenuProps {
  onLogout: () => void
}

// 06）归一化等级值（normalizeLevelCode）
/**
 * 函数名：normalizeLevelCode
 * 功能：将服务端返回的等级值归一化为 LevelBadge 可识别的枚举范围。
 * 实现方法：
 * - 定义允许的等级列表（N/R/SR/SSR/UR）
 * - 当等级为空、"null"、"undefined" 时返回 null（前端不渲染）
 * - 当输入等级命中允许列表时返回对应等级
 * - 其他异常值统一回退为 null，避免错误等级渲染
 * 输入：
 * - level：服务端返回的等级字符串
 * 输出：
 * - 返回值：LevelCode
 * - 副作用：无
 */
function normalizeLevelCode(level: string | null): LevelCode | null {
  const normalizedLevel = (level ?? '').trim().toUpperCase()
  if (!normalizedLevel || normalizedLevel === 'NULL' || normalizedLevel === 'UNDEFINED') {
    return null
  }
  const levelWhitelist: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']
  return levelWhitelist.includes(normalizedLevel as LevelCode) ? (normalizedLevel as LevelCode) : null
}

// 03）用户头像悬浮菜单组件（UserProfileMenu）
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
  const { userProfile } = useAuth()
  const { channel, menuData, isLoading, errorMessage } = useProfileMenu()
  const isOrganizationAccount = isOrganizationAdminRole(userProfile?.userRole)
  const sessionEntityCode = resolveSessionEntityCode(userProfile) ?? menuData?.entityCode ?? null
  const [isUserPanelOpen, setIsUserPanelOpen] = useState<boolean>(false)
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)
  const closeTimerRef = useRef<number | null>(null)
  const location = useLocation()

  const displayTitle = menuData?.title ?? fallbackCurrentUser.nickname
  const displayAvatarUrl = menuData?.avatarUrl ?? null
  const displayAvatarText = menuData?.avatarText ?? fallbackCurrentUser.avatarText
  const displayLevel = (menuData?.level ? normalizeLevelCode(menuData.level) : null) as LevelCode | null
  const verifiedOrganization = isOrganizationAccount ? null : menuData?.verifiedOrganization ?? null
  const verifyStatus = isOrganizationAccount ? null : menuData?.verifyStatus ?? null

  const stats = useMemo<UserStatViewItem[]>(() => buildDefaultStats(), [])
  const menuItems = useMemo<UserMenuViewItem[]>(() => {
    if (channel === 'organization' && sessionEntityCode) {
      return buildOrganizationDefaultMenuItems(sessionEntityCode)
    }
    return buildPersonalDefaultMenuItems()
  }, [channel, sessionEntityCode])

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

  // 04）鼠标移入处理（handleUserMenuMouseEnter）
  const handleUserMenuMouseEnter = (): void => {
    clearCloseTimer()
    setIsUserPanelOpen(true)
  }

  // 07）鼠标移出处理（handleUserMenuMouseLeave）
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

  // 08）头像按钮点击（handleUserButtonClick）
  /**
   * 函数名：handleUserButtonClick
   * 功能：点击头像时优先在新标签页打开个人空间；若已在个人空间，则切换面板开关。
   */
  const handleUserButtonClick = (): void => {
    clearCloseTimer()

    if (isOrganizationAccount) {
      if (!sessionEntityCode) {
        return
      }

      const organizationSpacePath = buildOrganizationSpacePath(sessionEntityCode)
      const currentPathEntityCode = extractEntityCodeFromPathname(location.pathname)
      const isOnCurrentOrganizationSpace =
        isOrganizationSpacePathname(location.pathname) && currentPathEntityCode === sessionEntityCode

      if (!isOnCurrentOrganizationSpace) {
        window.open(organizationSpacePath, '_blank', 'noopener,noreferrer')
        return
      }

      setIsUserPanelOpen((previousState) => !previousState)
      return
    }

    if (!isProfileSpacePathname(location.pathname)) {
      window.open(PROFILE_PATH, '_blank', 'noopener,noreferrer')
      return
    }

    setIsUserPanelOpen((previousState) => !previousState)
  }

  // 09）快捷统计入口点击（handleQuickEntryClick）
  /**
   * 函数名：handleQuickEntryClick
   * 功能：根据入口名称跳转 /profile?tab=目标Tab，跳转后关闭面板。
   * 输入：
   * - entryLabel：快捷入口名称（"动态" / "项目" / "笔记"）
   * 输出：
   * - 返回值：void
   * - 副作用：触发 window.open 与 state 更新
   */
  const handleQuickEntryClick = (targetTab: string): void => {
    if (!channel) {
      return
    }
    const targetPath = resolveProfileMenuStatPath(channel, targetTab, sessionEntityCode)
    window.open(targetPath, '_blank', 'noopener,noreferrer')
    setIsUserPanelOpen(false)
  }

  // 10）功能菜单入口点击（handleMenuItemClick）
  /**
   * 函数名：handleMenuItemClick
   * 功能：点击功能菜单项后按目标路径跳转并关闭菜单面板。
   * 实现方法：
   * - 接收接口返回的 targetPath 作为导航目标
   * - 使用 window.open 新标签打开，保持当前页上下文
   * - 跳转后关闭悬浮菜单面板
   * 输入：
   * - targetPath：功能菜单目标路径
   * 输出：
   * - 返回值：void
   * - 副作用：触发页面跳转并更新面板状态
   */
  const handleMenuItemClick = (targetPath: string): void => {
    window.open(targetPath, '_blank', 'noopener,noreferrer')
    setIsUserPanelOpen(false)
  }

  // 11）退出登录点击处理（handleLogoutClick）
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
        {displayAvatarUrl ? (
          <img className="user-avatar user-avatar--image" src={displayAvatarUrl} alt={`${displayTitle}头像`} />
        ) : (
          <span className="user-avatar user-avatar--fallback" aria-hidden="true">
            {displayAvatarText}
          </span>
        )}
      </button>

      <div className="user-panel" role="menu" aria-label="用户功能面板">
        <div className="user-panel__header">
          <div className="user-panel__name-row">
            <strong>{isLoading ? '加载中…' : displayTitle}</strong>
            {displayLevel ? <LevelBadge level={displayLevel} className="user-level-badge" /> : null}
          </div>
          {menuData?.subtitle ? <p className="auth-helper-tip">{menuData.subtitle}</p> : null}
          {!isOrganizationAccount ? (
            verifyStatus === 'verified' && verifiedOrganization ? (
              <VerifiedOrgModal organization={verifiedOrganization} />
            ) : verifyStatus === 'identity_only' ? (
              <VerifiedOrgButton label="主体认证" onNavigate={() => setIsUserPanelOpen(false)} />
            ) : (
              <VerifiedOrgButton label="去认证" onNavigate={() => setIsUserPanelOpen(false)} />
            )
          ) : null}
          {errorMessage ? <p className="auth-helper-tip auth-helper-tip--error">{errorMessage}</p> : null}
        </div>

        <div className="user-panel__stats">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              className="user-stat-item user-stat-button"
              onClick={() => handleQuickEntryClick(stat.targetTab)}
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
          {menuItems.map((item) => (
            <li key={item.label}>
              <button type="button" className="user-menu-item" onClick={() => handleMenuItemClick(item.targetPath)}>
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
