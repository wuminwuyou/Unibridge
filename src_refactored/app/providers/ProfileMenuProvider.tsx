// 01）ProfileMenu Context（轻量级版本）—— 无 API 调用，纯状态 + 降级数据
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAuth } from '../../shared/hooks/useAuth'
import { isOrganizationAdminRole } from '../../shared/lib/organizationSession'
import {
  BookOpenText, FolderKanban, MessageCircleMore,
  Send, Star, UserRound, Building2, type LucideIcon,
} from 'lucide-react'

export type ProfileMenuChannel = 'personal' | 'organization'

export interface ProfileMenuViewData {
  channel: ProfileMenuChannel
  title: string; subtitle: string | null
  level: string | null; verifyStatus: string | null
  verifiedOrganization: string | null; entityCode: string | null
  boundAdminCount: number | null; minAdminCount: number | null
  entityFullyActivated: boolean | null
}

interface ProfileMenuContextValue {
  channel: ProfileMenuChannel | null
  menuData: ProfileMenuViewData | null
  isLoading: boolean
  errorMessage: string
}

const ProfileMenuContext = createContext<ProfileMenuContextValue | null>(null)

export function ProfileMenuProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, userProfile } = useAuth()

  const channel: ProfileMenuChannel | null = useMemo(() => {
    if (!isLoggedIn) return null
    return isOrganizationAdminRole(userProfile?.userRole) ? 'organization' : 'personal'
  }, [isLoggedIn, userProfile?.userRole])

  const menuData: ProfileMenuViewData | null = useMemo(() => {
    if (!isLoggedIn) return null
    const isOrg = channel === 'organization'
    const entityCode = userProfile?.entityCode ?? null
    const entityName = userProfile?.entityName ?? entityCode ?? '机构'
    return {
      channel: channel ?? 'personal',
      title: isOrg ? entityName ?? '机构' : (userProfile?.uid ?? '用户'),
      subtitle: isOrg ? null : null,
      level: null,
      verifyStatus: userProfile?.verifyStatus ?? null,
      verifiedOrganization: userProfile?.verifiedOrganization ?? null,
      entityCode,
      boundAdminCount: null,
      minAdminCount: null,
      entityFullyActivated: null,
    }
  }, [isLoggedIn, channel, userProfile])

  return (
    <ProfileMenuContext.Provider value={{ channel, menuData, isLoading: false, errorMessage: '' }}>
      {children}
    </ProfileMenuContext.Provider>
  )
}

export function useProfileMenu(): ProfileMenuContextValue {
  const ctx = useContext(ProfileMenuContext)
  if (!ctx) throw new Error('useProfileMenu 必须在 ProfileMenuProvider 内使用')
  return ctx
}

// 02）静态数据（工具函数）
export interface UserStatViewItem { label: string; icon: LucideIcon; targetTab: string }
export interface UserMenuViewItem { key: string; label: string; icon: LucideIcon; targetPath: string }

const userStats: { label: string; icon: LucideIcon }[] = [
  { label: '动态', icon: MessageCircleMore },
  { label: '项目', icon: FolderKanban },
  { label: '笔记', icon: BookOpenText },
]
const userStatTabMap: Record<string, string> = { 动态: '主页', 项目: '项目', 笔记: '笔记' }
const userMenuIcons: LucideIcon[] = [UserRound, Send, Star]

export function buildDefaultStats(): UserStatViewItem[] {
  return userStats.map(s => ({ label: s.label, icon: s.icon, targetTab: userStatTabMap[s.label] ?? '主页' }))
}

export function buildPersonalDefaultMenuItems(): UserMenuViewItem[] {
  return [
    { key: 'profile', label: '个人中心', icon: userMenuIcons[0], targetPath: '/profile' },
    { key: 'publish', label: '发布管理', icon: userMenuIcons[1], targetPath: '/profile' },
    { key: 'favorite', label: '我的收藏', icon: userMenuIcons[2], targetPath: '/profile' },
  ]
}

export function buildOrganizationDefaultMenuItems(entityCode: string): UserMenuViewItem[] {
  const targetPath = `/org?uid=${encodeURIComponent(entityCode)}`
  return [{ key: 'org-space', label: '机构空间', icon: Building2, targetPath }]
}
