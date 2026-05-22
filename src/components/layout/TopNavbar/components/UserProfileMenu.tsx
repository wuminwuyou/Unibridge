import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
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
  type LucideIcon,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import LevelBadge, { type LevelCode } from '../../../common/LevelBadge'
import {
  getCachedUserProfileMenu,
  getUserProfileMenu,
  setCachedUserProfileMenu,
  type UserProfileMenuData,
} from '../../../../api'
import { getUserId } from '../../../../auth/tokenStorage'
import { useAuth } from '../../../../contexts/AuthContext'
import { currentUser as fallbackCurrentUser, userStatTabMap } from '../../../../data/currentUserData'

// 01）用户头像悬浮菜单常量
const CLOSE_TIMER_DELAY_MS = 180
const PROFILE_PATH = '/profile'

// 02）用户统计入口视图类型（UserStatViewItem）
interface UserStatViewItem {
  label: string
  icon: LucideIcon
  targetTab: string
}

// 03）用户菜单入口视图类型（UserMenuViewItem）
interface UserMenuViewItem {
  key: string
  label: string
  icon: LucideIcon
  targetPath: string
}

// 04）用户头部展示信息类型（UserProfileViewState）
interface UserProfileViewState {
  nickname: string
  verifiedOrganization: string | null
  level: LevelCode | null
  avatarUrl: string | null
  avatarText: string
}

// 05）用户头像悬浮菜单参数（UserProfileMenuProps）
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

// 07）构建默认统计入口（buildDefaultStats）
/**
 * 函数名：buildDefaultStats
 * 功能：在接口未返回统计项时构建可用的默认统计入口数据。
 * 实现方法：
 * - 读取既有 userStatTabMap 映射，保证跳转行为与旧逻辑一致
 * - 逐项填充图标与目标 tab
 * - 返回固定顺序的“动态/项目/笔记”
 * 输入：无
 * 输出：
 * - 返回值：UserStatViewItem[]
 * - 副作用：无
 */
function buildDefaultStats(): UserStatViewItem[] {
  return [
    { label: '动态', icon: MessageCircleMore, targetTab: userStatTabMap.动态 ?? '主页' },
    { label: '项目', icon: FolderKanban, targetTab: userStatTabMap.项目 ?? '项目' },
    { label: '笔记', icon: BookOpenText, targetTab: userStatTabMap.笔记 ?? '笔记' },
  ]
}

// 08）构建默认菜单入口（buildDefaultMenuItems）
/**
 * 函数名：buildDefaultMenuItems
 * 功能：在接口未返回菜单项时构建可用的默认功能菜单数据。
 * 实现方法：
 * - 提供个人中心、发布管理、我的收藏三个默认菜单
 * - 统一补齐 key、图标与目标路由
 * - 返回固定顺序以保持交互一致性
 * 输入：无
 * 输出：
 * - 返回值：UserMenuViewItem[]
 * - 副作用：无
 */
function buildDefaultMenuItems(): UserMenuViewItem[] {
  return [
    { key: 'profile', label: '个人中心', icon: UserRound, targetPath: '/profile' },
    { key: 'publish', label: '发布管理', icon: Send, targetPath: '/profile?tab=发布' },
    { key: 'favorite', label: '我的收藏', icon: Star, targetPath: '/profile?tab=收藏' },
  ]
}

// 09）归一化可空文本（normalizeNullableText）
/**
 * 函数名：normalizeNullableText
 * 功能：将接口返回的可空文本归一化为可渲染值或 null。
 * 实现方法：
 * - 统一处理 null / undefined / 空字符串
 * - 过滤字符串 "null" / "undefined" 等无效占位值
 * - 返回有效文本，否则返回 null
 * 输入：
 * - value：接口返回的字符串或 null
 * 输出：
 * - 返回值：string | null
 * - 副作用：无
 */
function normalizeNullableText(value: string | null): string | null {
  const normalizedValue = (value ?? '').trim()
  if (!normalizedValue) {
    return null
  }
  const normalizedLowerCaseValue = normalizedValue.toLowerCase()
  if (normalizedLowerCaseValue === 'null' || normalizedLowerCaseValue === 'undefined') {
    return null
  }
  return normalizedValue
}

// 10）应用用户菜单数据到页面状态（applyUserProfileMenuData）
/**
 * 函数名：applyUserProfileMenuData
 * 功能：将接口返回的用户菜单数据转换并写入组件状态。
 * 实现方法：
 * - 按字段优先级更新昵称、等级、头像地址、头像文本与认证主体
 * - 对 level 与 verifiedOrganization 做空值归一化，不可用时置为 null
 * - 保持统计入口和菜单入口使用前端固定配置，不依赖接口字段
 * 输入：
 * - menuData：用户菜单接口数据
 * - setCurrentUserProfile：用户信息状态更新函数
 * 输出：
 * - 返回值：void
 * - 副作用：更新 React 组件状态
 */
function applyUserProfileMenuData(
  menuData: UserProfileMenuData,
  setCurrentUserProfile: Dispatch<SetStateAction<UserProfileViewState>>,
): void {
  const normalizedNickname = normalizeNullableText(menuData.nickname) ?? fallbackCurrentUser.nickname
  const normalizedAvatarUrl = normalizeNullableText(menuData.avatarUrl)
  setCurrentUserProfile({
    nickname: normalizedNickname,
    verifiedOrganization: normalizeNullableText(menuData.verifiedOrganization),
    level: normalizeLevelCode(menuData.level),
    avatarUrl: normalizedAvatarUrl,
    avatarText: normalizedAvatarUrl ? '' : (normalizedNickname || '无').slice(0, 1),
  })
}

// 11）用户头像悬浮菜单组件（UserProfileMenu）
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
  const { isLoggedIn, isHydrated, userProfile, setUserProfile } = useAuth()
  const [isUserPanelOpen, setIsUserPanelOpen] = useState<boolean>(false)
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfileViewState>({
    nickname: fallbackCurrentUser.nickname,
    verifiedOrganization: fallbackCurrentUser.verifiedOrganization,
    level: fallbackCurrentUser.level,
    avatarUrl: null,
    avatarText: fallbackCurrentUser.avatarText,
  })
  const [stats, setStats] = useState<UserStatViewItem[]>(() => buildDefaultStats())
  const [menuItems, setMenuItems] = useState<UserMenuViewItem[]>(() => buildDefaultMenuItems())
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

  // 05）菜单数据加载副作用（useEffect）
  useEffect(() => {
    if (!isHydrated || !isLoggedIn) {
      return
    }
    let isComponentActive = true
    const currentUserId = userProfile?.userId ?? getUserId()

    void (async () => {
      try {
        const cachedMenuData = getCachedUserProfileMenu(currentUserId)
        if (cachedMenuData && isComponentActive) {
          applyUserProfileMenuData(cachedMenuData, setCurrentUserProfile)
        }

        const menuData = await getUserProfileMenu()
        if (!isComponentActive) {
          return
        }
        applyUserProfileMenuData(menuData, setCurrentUserProfile)

        const effectiveUserId = menuData.userId || currentUserId
        if (effectiveUserId) {
          setCachedUserProfileMenu(effectiveUserId, menuData)
          setUserProfile({
            userId: effectiveUserId,
            userRole: userProfile?.userRole,
            authStatus: userProfile?.authStatus,
          })
        }
      } catch (_error) {
        if (!isComponentActive) {
          return
        }
        setCurrentUserProfile({
          nickname: '？未知用户？',
          verifiedOrganization: null,
          level: null,
          avatarUrl: null,
          avatarText: '无',
        })
        setStats(buildDefaultStats())
        setMenuItems(buildDefaultMenuItems())
      }
    })()

    return () => {
      isComponentActive = false
    }
  }, [isHydrated, isLoggedIn, setUserProfile, userProfile?.userId])

  // 06）鼠标移入处理（handleUserMenuMouseEnter）
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
    if (location.pathname !== PROFILE_PATH) {
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
    window.open(`${PROFILE_PATH}?tab=${encodeURIComponent(targetTab)}`, '_blank', 'noopener,noreferrer')
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
        {currentUserProfile.avatarUrl ? (
          <img className="user-avatar user-avatar--image" src={currentUserProfile.avatarUrl} alt={`${currentUserProfile.nickname}头像`} />
        ) : (
          <span className="user-avatar user-avatar--fallback" aria-hidden="true">
            {currentUserProfile.avatarText}
          </span>
        )}
      </button>

      <div className="user-panel" role="menu" aria-label="用户功能面板">
        <div className="user-panel__header">
          <div className="user-panel__name-row">
            <strong>{currentUserProfile.nickname}</strong>
            {currentUserProfile.level ? <LevelBadge level={currentUserProfile.level} className="user-level-badge" /> : null}
          </div>
          {currentUserProfile.verifiedOrganization ? (
            <span className="user-verify-badge">
              <BadgeCheck size={16} strokeWidth={2} aria-hidden="true" />
              {currentUserProfile.verifiedOrganization}
            </span>
          ) : null}
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
