import { supportedPersonalViewTabs } from './personalViewPageData'
import type { ProfileTab } from './types'

// 01）Tab 对应 URL 路径段（profileTabRouteSegmentByTab）
export const profileTabRouteSegmentByTab: Record<ProfileTab, string | null> = {
  主页: null,
  项目: 'project',
  笔记: 'note',
  收藏: 'favorite',
  设置: 'settings',
}

// 02）URL 路径段对应 Tab（profileTabByRouteSegment）
export const profileTabByRouteSegment: Record<string, ProfileTab> = {
  project: '项目',
  note: '笔记',
  favorite: '收藏',
  settings: '设置',
}

// 03）解析路径中的 Tab 路径段（extractProfileTabRouteSegment）
export function extractProfileTabRouteSegment(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  if (normalizedPath === '/profile') {
    return null
  }

  const match = normalizedPath.match(/^\/profile\/([^/]+)$/)
  if (!match) {
    return null
  }

  return decodeURIComponent(match[1])
}

// 04）判断是否为个人空间路由（isProfileSpacePathname）
/**
 * 函数名：isProfileSpacePathname
 * 功能：判断当前 pathname 是否属于个人空间页（含 Tab 子路径）。
 * 输入：
 * - pathname：location.pathname
 * 输出：
 * - 返回值：boolean
 */
export function isProfileSpacePathname(pathname: string): boolean {
  return pathname === '/profile' || pathname.startsWith('/profile/')
}

// 05）由 Tab 构建路径（buildProfileTabPath）
/**
 * 函数名：buildProfileTabPath
 * 功能：将 ProfileTab 映射为 /profile 或 /profile/{segment} 路径。
 * 输入：
 * - tab：ProfileTab
 * 输出：
 * - 返回值：路径字符串
 */
export function buildProfileTabPath(tab: ProfileTab): string {
  const segment = profileTabRouteSegmentByTab[tab]
  if (!segment) {
    return '/profile'
  }

  return `/profile/${segment}`
}

// 06）由 pathname 解析 Tab（resolveProfileTabFromPathname）
/**
 * 函数名：resolveProfileTabFromPathname
 * 功能：从 /profile 或 /profile/{segment} 解析当前 Tab。
 * 实现方法：
 * - /profile → 主页
 * - 合法 segment → 对应 Tab
 * - 非法 segment → 回退主页（由调用方决定是否重定向）
 * 输入：
 * - pathname：location.pathname
 * 输出：
 * - 返回值：ProfileTab
 */
export function resolveProfileTabFromPathname(pathname: string): ProfileTab {
  const segment = extractProfileTabRouteSegment(pathname)
  if (!segment) {
    return '主页'
  }

  return profileTabByRouteSegment[segment] ?? '主页'
}

// 07）判断路径段是否合法（isSupportedProfileTabRouteSegment）
/**
 * 函数名：isSupportedProfileTabRouteSegment
 * 功能：校验 /profile/{segment} 中的 segment 是否为受支持 Tab。
 * 输入：
 * - segment：URL 路径段，null 表示 /profile 根路径
 * 输出：
 * - 返回值：boolean
 */
export function isSupportedProfileTabRouteSegment(segment: string | null): boolean {
  if (segment == null) {
    return true
  }

  return segment in profileTabByRouteSegment
}

// 08）从旧版 ?tab= 查询参数解析 Tab（resolveProfileTabFromLegacySearch）
/**
 * 函数名：resolveProfileTabFromLegacySearch
 * 功能：兼容旧链接 /profile?tab=项目 的 Tab 解析。
 * 输入：
 * - search：location.search
 * 输出：
 * - 返回值：ProfileTab | null（无 tab 参数时返回 null）
 */
export function resolveProfileTabFromLegacySearch(search: string): ProfileTab | null {
  const searchParams = new URLSearchParams(search)
  const tab = searchParams.get('tab')
  if (!tab) {
    return null
  }

  if (supportedPersonalViewTabs.has(tab as ProfileTab)) {
    return tab as ProfileTab
  }

  return null
}
