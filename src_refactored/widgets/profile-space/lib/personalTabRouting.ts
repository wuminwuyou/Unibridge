// 01）个人空间 Tab 列表（personalViewTabs）
import { isUserResourceUid, type UserResourceUid } from '@shared/api/resourceUid'

export const personalViewTabs = ['主页', '项目', '笔记', '收藏', '设置'] as const
export type PersonalProfileTab = (typeof personalViewTabs)[number]
export const supportedPersonalViewTabs: ReadonlySet<PersonalProfileTab> = new Set(personalViewTabs)

// 02）Tab ↔ URL 路径段映射
export const personalTabRouteSegmentByTab: Record<PersonalProfileTab, string | null> = {
  主页: null,
  项目: 'project',
  笔记: 'note',
  收藏: 'favorite',
  设置: 'settings',
}

export const personalTabByRouteSegment: Record<string, PersonalProfileTab> = {
  project: '项目',
  note: '笔记',
  favorite: '收藏',
  settings: '设置',
}

// 03）提取 /profile 路径中的 Tab 段（extractPersonalTabRouteSegment）
export function extractPersonalTabRouteSegment(pathname: string): string | null {
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

// 04）判断路径段是否合法（isSupportedPersonalTabRouteSegment）
export function isSupportedPersonalTabRouteSegment(segment: string | null): boolean {
  if (segment == null) return true
  return segment in personalTabByRouteSegment
}

// 05）由 pathname 解析 Tab（resolvePersonalTabFromPathname）
export function resolvePersonalTabFromPathname(pathname: string): PersonalProfileTab {
  const segment = extractPersonalTabRouteSegment(pathname)
  if (!segment) return '主页'
  return personalTabByRouteSegment[segment] ?? '主页'
}

// 06）由 ?uid= 解析目标用户 uid（extractPersonalProfileUidFromSearch）
export function extractPersonalProfileUidFromSearch(search: string): UserResourceUid | null {
  const searchParams = new URLSearchParams(search)
  const uid = searchParams.get('uid')?.trim()
  return uid && isUserResourceUid(uid) ? uid : null
}

// 07）构建个人空间路径（buildPersonalSpacePath）
/**
 * 函数名：buildPersonalSpacePath
 * 功能：根据目标用户 uid 与 Tab 构建 /profile[/segment]?uid= 路径。
 * 输入：
 * - profileUid：要查看的用户 uid（缺省 = 当前登录用户空间）
 * - tab：PersonalProfileTab，默认 主页
 * 输出：
 * - 返回值：路径字符串
 * - 副作用：无
 */
export function buildPersonalSpacePath(
  profileUid?: UserResourceUid | null,
  tab: PersonalProfileTab = '主页',
): string {
  const segment = personalTabRouteSegmentByTab[tab]
  const basePath = segment ? `/profile/${segment}` : '/profile'
  if (!profileUid || !isUserResourceUid(profileUid)) {
    return basePath
  }
  const searchParams = new URLSearchParams()
  searchParams.set('uid', profileUid)
  return `${basePath}?${searchParams.toString()}`
}

// 08）兼容旧版 ?tab= 查询参数（resolvePersonalTabFromLegacySearch）
export function resolvePersonalTabFromLegacySearch(search: string): PersonalProfileTab | null {
  const searchParams = new URLSearchParams(search)
  const tab = searchParams.get('tab')
  if (!tab) return null
  return supportedPersonalViewTabs.has(tab as PersonalProfileTab) ? (tab as PersonalProfileTab) : null
}
