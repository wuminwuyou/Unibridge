import {
  BadgeCheck,
  BookOpenText,
  FolderKanban,
  MessageCircleMore,
  Send,
  Star,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

// 01）使用方说明
/**
 * 该文件集中维护"当前登录用户"在导航顶部的静态展示数据。
 * 使用方：apps/web-client/src/layout/TopNavbar/components/UserProfileMenu
 * 数据范围：当前用户基本信息 / 用户统计入口 / 用户菜单项
 *
 * 注：BadgeCheck 一并导出以保持 UserProfileMenu 中"认证主体徽标"与数据来源一致。
 */

// 02）用户统计入口类型（UserStatItem）
export interface UserStatItem {
  label: string
  icon: LucideIcon
}

// 03）用户菜单项类型（UserMenuItem）
export interface UserMenuItem {
  label: string
  icon: LucideIcon
}

// 04）当前用户基本信息（currentUser）
export const currentUser = {
  nickname: '无名_无忧',
  verifiedOrganization: '深圳技术大学',
  level: 'SSR' as const,
  avatarText: '无',
}

// 05）认证主体徽标图标（verifiedBadgeIcon）
export const verifiedBadgeIcon: LucideIcon = BadgeCheck

// 06）用户统计入口数据（userStats）
export const userStats: UserStatItem[] = [
  { label: '动态', icon: MessageCircleMore },
  { label: '项目', icon: FolderKanban },
  { label: '笔记', icon: BookOpenText },
]

// 07）用户菜单项数据（userMenuItems）
export const userMenuItems: UserMenuItem[] = [
  { label: '个人中心', icon: UserRound },
  { label: '发布管理', icon: Send },
  { label: '我的收藏', icon: Star },
]

// 08）用户统计入口 -> 个人空间 Tab 映射（userStatTabMap）
/**
 * 用途：UserProfileMenu 中点击「动态/项目/笔记」快捷入口时跳转 /profile?tab=xxx 用。
 */
export const userStatTabMap: Record<string, string> = {
  动态: '主页',
  项目: '项目',
  笔记: '笔记',
}
