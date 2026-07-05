// 01）TopNavbar 用户头像菜单（TopNavbarUserProfileMenu）
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, LogOut } from 'lucide-react'
import {
  buildDefaultStats,
  buildOrganizationDefaultMenuItems,
  buildPersonalDefaultMenuItems,
  type ProfileMenuChannel,
} from '@app/providers/ProfileMenuProvider'
import { useAuth } from '@shared/hooks/useAuth'
import { useUserAvatarData } from '@shared/hooks/useUserAvatarData'
import { getMenuCache, getUserUid } from '@shared/lib/tokenStorage'
import { isOrganizationAdminRole } from '@shared/lib/organizationSession'
import LevelBadge from '@shared/ui/LevelBadge'
import UserAvatar from '@shared/ui/UserAvatar'
import { useUserMenuData } from '../hooks/useUserMenuData'

// 02）组件 Props（TopNavbarUserProfileMenuProps）
export interface TopNavbarUserProfileMenuProps {
  onLogout: () => void
}

/**
 * 函数名：TopNavbarUserProfileMenu
 * 功能：渲染用户头像 hover 面板（资料、统计、菜单、退出）。
 * 输入：
 * - onLogout：退出登录回调
 * 输出：
 * - 返回值：React 节点
 */
export function TopNavbarUserProfileMenu({ onLogout }: TopNavbarUserProfileMenuProps) {
  const { userProfile } = useAuth()
  const isOrgAccount = isOrganizationAdminRole(userProfile?.userRole)
  const channel: ProfileMenuChannel | null = isOrgAccount ? 'organization' : userProfile ? 'personal' : null
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  const { avatarUrl, fallbackText: avatarFallbackText } = useUserAvatarData()
  const { data: menuData } = useUserMenuData(isOpen)

  const localCache = getMenuCache()
  const displayName =
    menuData?.nickname?.trim()
    || localCache?.nickname?.trim()
    || (isOrgAccount ? (userProfile?.entityName ?? '机构') : (userProfile?.uid ?? '用户'))
  const displayLevel = menuData?.level ?? localCache?.level ?? 'N'
  const userId = userProfile?.uid ?? getUserUid()
  const profilePath = userId ? `/profile?uid=${encodeURIComponent(userId)}` : '/profile'
  const avatarHref =
    isOrgAccount && userProfile?.entityCode
      ? `/org?uid=${encodeURIComponent(userProfile.entityCode)}`
      : profilePath

  const levelWhitelist = ['N', 'R', 'SR', 'SSR', 'UR']
  const normalizedLevel = (
    levelWhitelist.includes(displayLevel?.toUpperCase() ?? '') ? displayLevel?.toUpperCase() : 'N'
  ) as 'N' | 'R' | 'SR' | 'SSR' | 'UR'
  const stats = useMemo(() => buildDefaultStats(), [])
  const isOrg = channel === 'organization'
  const menuItems = useMemo(() => {
    if (isOrg && userProfile?.entityCode) {
      return buildOrganizationDefaultMenuItems(userProfile.entityCode)
    }
    return buildPersonalDefaultMenuItems()
  }, [isOrg, userProfile?.entityCode])

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    },
    [],
  )

  const clearCloseTimer = (): void => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const handleEnter = (): void => {
    clearCloseTimer()
    setIsOpen(true)
  }

  const handleLeave = (): void => {
    if (isLoggingOut) {
      return
    }
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false)
      closeTimerRef.current = null
    }, 180)
  }

  const handleLogout = (): void => {
    if (isLoggingOut) {
      return
    }
    clearCloseTimer()
    setIsLoggingOut(true)
    onLogout()
  }

  return (
    <div
      className={`user-menu ${isOpen || isLoggingOut ? 'is-open' : ''}`.trim()}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <UserAvatar
        className="user-button"
        href={avatarHref}
        avatarUrl={avatarUrl}
        fallbackText={avatarFallbackText}
        alt={`${displayName}头像`}
      />
      <div className="user-panel" role="menu">
        <div className="user-panel__header">
          <div className="user-panel__name-row">
            <strong>{displayName}</strong>
            <LevelBadge level={normalizedLevel} className="user-level-badge" />
          </div>
        </div>
        <div className="user-panel__stats">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              className="user-stat-item user-stat-button"
              onClick={() => window.open(profilePath, '_blank')}
            >
              <span className="user-stat-item__icon">
                <stat.icon size={24} />
              </span>
              <span>{stat.label}</span>
            </button>
          ))}
        </div>
        <ul className="user-panel__menu-list">
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className="user-menu-item"
                onClick={() => {
                  window.open(item.targetPath, '_blank')
                  setIsOpen(false)
                }}
              >
                <span className="user-menu-item__left">
                  <span className="user-menu-item__icon">
                    <item.icon size={24} />
                  </span>
                  <span>{item.label}</span>
                </span>
                <span className="user-menu-item__arrow">
                  <ChevronRight size={24} />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="user-logout-button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <span className="user-logout-button__icon">
            <LogOut size={24} />
          </span>
          <span>{isLoggingOut ? '正在退出登录…' : '退出登录'}</span>
        </button>
      </div>
    </div>
  )
}
