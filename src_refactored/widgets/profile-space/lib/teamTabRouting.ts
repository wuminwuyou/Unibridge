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

// 03）从 /team/:teamUid[/...] 解析 teamUid（extractTeamUidFromPathname）
export function extractTeamUidFromPathname(pathname: string): TeamResourceUid | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/team\/([^/]+)(?:\/[^/]+)?(?:\/[^/]+)?$/)
  if (!match) return null
  const teamUid = decodeURIComponent(match[1])
  return teamUid.trim().length > 0 ? teamUid : null
}

// 04）解析 Tab 路径段（extractTeamTabRouteSegment）
export function extractTeamTabRouteSegment(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/team\/[^/]+\/([^/]+)(?:\/[^/]+)?$/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

// 05）解析子路径段（如 member/manage 中的 manage）
export function extractTeamSubRouteSegment(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/team\/[^/]+\/[^/]+\/([^/]+)$/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

// 06）构建团队空间路径（buildTeamSpacePath）
export function buildTeamSpacePath(teamUid: TeamResourceUid, tab: TeamProfileTab = '主页'): string {
  const encodedTeamUid = encodeURIComponent(teamUid)
  const segment = teamTabRouteSegmentByTab[tab]
  if (!segment) return `/team/${encodedTeamUid}`
  return `/team/${encodedTeamUid}/${segment}`
}

// 07）构建团队成员管理页路径（buildTeamMembersManagePath）
export function buildTeamMembersManagePath(teamUid: TeamResourceUid): string {
  const encodedTeamUid = encodeURIComponent(teamUid)
  return `/team/${encodedTeamUid}/member/manage`
}

// 08）判断是否为团队成员管理页（isTeamMembersManagePathname）
export function isTeamMembersManagePathname(pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return /^\/team\/[^/]+\/member\/manage$/.test(normalizedPath)
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
