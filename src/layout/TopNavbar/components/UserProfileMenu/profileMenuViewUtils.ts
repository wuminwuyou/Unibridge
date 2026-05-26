import { Building2, type LucideIcon } from 'lucide-react'
import type { ProfileMenuChannel } from '../../../../contexts/ProfileMenuContext'
import { userMenuItems, userStats, userStatTabMap } from '../../../../data/currentUserData'
import { buildProfileTabPath } from '../../../../pages/ProfileSpace/profileTabRouting'
import { buildOrganizationSpacePath } from '../../../../pages/ProfileSpace/variants/OrganizationView/organizationTabRouting'
import type { ProfileTab } from '../../../../pages/ProfileSpace/variants/PersonalView/types'
import type { OrganizationTab } from '../../../../pages/ProfileSpace/variants/OrganizationView/types'

// 01）用户统计入口视图类型（UserStatViewItem）
export interface UserStatViewItem {
  label: string
  icon: LucideIcon
  targetTab: string
}

// 02）用户菜单入口视图类型（UserMenuViewItem）
export interface UserMenuViewItem {
  key: string
  label: string
  icon: LucideIcon
  targetPath: string
}

// 03）构建默认统计入口（buildDefaultStats）
export function buildDefaultStats(): UserStatViewItem[] {
  return userStats.map((stat) => ({
    label: stat.label,
    icon: stat.icon,
    targetTab: userStatTabMap[stat.label] ?? '主页',
  }))
}

// 04）构建个人默认菜单（buildPersonalDefaultMenuItems）
export function buildPersonalDefaultMenuItems(): UserMenuViewItem[] {
  return [
    { key: 'profile', label: '个人中心', icon: userMenuItems[0].icon, targetPath: '/profile' },
    { key: 'publish', label: '发布管理', icon: userMenuItems[1].icon, targetPath: '/profile' },
    {
      key: 'favorite',
      label: '我的收藏',
      icon: userMenuItems[2].icon,
      targetPath: buildProfileTabPath('收藏'),
    },
  ]
}

// 05）构建机构默认菜单（buildOrganizationDefaultMenuItems）
export function buildOrganizationDefaultMenuItems(entityCode: string): UserMenuViewItem[] {
  return [
    {
      key: 'org-space',
      label: '机构空间',
      icon: Building2,
      targetPath: buildOrganizationSpacePath(entityCode),
    },
  ]
}

// 06）解析统计入口跳转路径（resolveProfileMenuStatPath）
export function resolveProfileMenuStatPath(
  channel: ProfileMenuChannel,
  targetTab: string,
  entityCode: string | null,
): string {
  if (channel === 'organization' && entityCode) {
    const organizationTab = (targetTab === '动态' ? '主页' : targetTab) as OrganizationTab
    return buildOrganizationSpacePath(entityCode, organizationTab)
  }

  const personalTab = (userStatTabMap[targetTab] ?? '主页') as ProfileTab
  return buildProfileTabPath(personalTab)
}
