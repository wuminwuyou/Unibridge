// 01）团队空间 Tab 列表（teamViewTabs）
import type { TeamResourceUid } from '@shared/api/resourceUid'

export const teamViewTabs = ['主页', '成员', '成果', '项目', '笔记'] as const
export type TeamProfileTab = (typeof teamViewTabs)[number]

// 02）Tab ↔ URL 路径段映射
export const teamTabRouteSegmentByTab: Record<TeamProfileTab, string | null> = {
  主页: null,
  成员: 'member',
  成果: 'achievement',
  项目: 'project',
  笔记: 'note',
}

export const teamTabByRouteSegment: Record<string, TeamProfileTab> = {
  member: '成员',
  achievement: '成果',
  project: '项目',
  note: '笔记',
}

// 03）从 ?uid= 读取 teamUid（extractTeamUidFromSearch）
/**
 * 函数名：extractTeamUidFromSearch
 * 功能：从 location.search 解析当前团队空间的 teamUid。
 * 输入：
 * - search：location.search
 * 输出：
 * - 返回值：TeamResourceUid | null
 * - 副作用：无
 */
export function extractTeamUidFromSearch(search: string): TeamResourceUid | null {
  const searchParams = new URLSearchParams(search)
  const uid = searchParams.get('uid')?.trim()
  return uid && uid.length > 0 ? uid : null
}

// 04）解析 Tab 路径段（extractTeamTabRouteSegment）
export function extractTeamTabRouteSegment(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  if (normalizedPath === '/team') return null
  const match = normalizedPath.match(/^\/team\/([^/]+)(?:\/[^/]+)?$/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

// 05）解析子路径段（extractTeamSubRouteSegment）
export function extractTeamSubRouteSegment(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/team\/[^/]+\/([^/]+)$/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

// 06）构建团队空间路径（buildTeamSpacePath）
export function buildTeamSpacePath(teamUid: TeamResourceUid, tab: TeamProfileTab = '主页'): string {
  const segment = teamTabRouteSegmentByTab[tab]
  const basePath = segment ? `/team/${segment}` : '/team'
  const searchParams = new URLSearchParams()
  searchParams.set('uid', teamUid)
  return `${basePath}?${searchParams.toString()}`
}

// 07）构建团队成员管理页路径（buildTeamMembersManagePath）
export function buildTeamMembersManagePath(teamUid: TeamResourceUid): string {
  const searchParams = new URLSearchParams()
  searchParams.set('uid', teamUid)
  return `/team/member/manage?${searchParams.toString()}`
}

// 08）判断是否为团队成员管理页（isTeamMembersManagePathname）
export function isTeamMembersManagePathname(pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return normalizedPath === '/team/member/manage'
}

// 09）由 pathname 解析 Tab（resolveTeamTabFromPathname）
export function resolveTeamTabFromPathname(pathname: string): TeamProfileTab {
  const segment = extractTeamTabRouteSegment(pathname)
  if (!segment) return '主页'
  return teamTabByRouteSegment[segment] ?? '主页'
}

// 10）判断是否为团队空间路径（isTeamSpacePathname）
export function isTeamSpacePathname(pathname: string): boolean {
  return pathname === '/team' || pathname.startsWith('/team/')
}

// 11）校验 Tab 路径段合法性（isSupportedTeamTabRouteSegment）
export function isSupportedTeamTabRouteSegment(
  segment: string | null,
  subSegment: string | null = null,
): boolean {
  if (segment == null) return subSegment == null
  if (!(segment in teamTabByRouteSegment)) return false
  if (subSegment == null) return true
  if (segment === 'member') return subSegment === 'manage'
  return false
}

// 12）旧版 /team/:teamUid[/:tab[/manage]] 重定向（resolveLegacyTeamSpaceRedirect）
/**
 * 函数名：resolveLegacyTeamSpaceRedirect
 * 功能：将旧版路径段携带 teamUid 的 URL 重定向为 ?uid= 查询参数形式。
 * 输入：
 * - pathname：location.pathname
 * - search：location.search
 * 输出：
 * - 返回值：新路径或 null（无需重定向）
 * - 副作用：无
 */
export function resolveLegacyTeamSpaceRedirect(pathname: string, search: string): string | null {
  if (extractTeamUidFromSearch(search)) return null

  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  if (normalizedPath === '/team') return null

  const match = normalizedPath.match(/^\/team\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?$/)
  if (!match) return null

  const firstSegment = decodeURIComponent(match[1])
  if (firstSegment in teamTabByRouteSegment) return null

  const teamUid = firstSegment
  const tabSegment = match[2] ? decodeURIComponent(match[2]) : null
  const subSegment = match[3] ? decodeURIComponent(match[3]) : null

  if (tabSegment === 'member' && subSegment === 'manage') {
    return buildTeamMembersManagePath(teamUid)
  }

  const tab = tabSegment ? (teamTabByRouteSegment[tabSegment] ?? '主页') : '主页'
  return buildTeamSpacePath(teamUid, tab)
}
