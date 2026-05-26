import type { TeamResourceUid } from '../../../../api/resourceUid'
import { isUserResourceUid } from '../../../../api/resourceUid'
import type { TeamTab } from './types'

// 01）Tab 对应 URL 路径段（teamTabRouteSegmentByTab）
export const teamTabRouteSegmentByTab: Record<TeamTab, string | null> = {
  主页: null,
  成员: 'member',
  成果: 'achievement',
  项目: 'project',
  笔记: 'note',
}

// 02）URL 路径段对应 Tab（teamTabByRouteSegment）
export const teamTabByRouteSegment: Record<string, TeamTab> = {
  member: '成员',
  achievement: '成果',
  project: '项目',
  note: '笔记',
}

// 03）解析团队 uid（extractTeamUidFromPathname）
/**
 * 函数名：extractTeamUidFromPathname
 * 功能：从 /team/:teamUid 或 /team/:teamUid/:tab 解析 teamUid。
 * 输入：
 * - pathname：location.pathname
 * 输出：
 * - 返回值：TeamResourceUid | null
 * - 副作用：无
 */
export function extractTeamUidFromPathname(pathname: string): TeamResourceUid | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/team\/([^/]+)(?:\/[^/]+)?$/)
  if (!match) {
    return null
  }

  const teamUid = decodeURIComponent(match[1])
  return teamUid.trim().length > 0 ? teamUid : null
}

// 04）解析 Tab 路径段（extractTeamTabRouteSegment）
export function extractTeamTabRouteSegment(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/team\/[^/]+\/([^/]+)(?:\/[^/]+)?$/)
  if (!match) {
    return null
  }

  return decodeURIComponent(match[1])
}

// 04.1）解析 Tab 子路径段（extractTeamSubRouteSegment）
/**
 * 函数名：extractTeamSubRouteSegment
 * 功能：解析 /team/:teamUid/:tab/:subTab 中的 subTab（如 member/manage 的 manage）。
 * 输入：
 * - pathname：location.pathname
 * 输出：
 * - 返回值：子路径段或 null
 * - 副作用：无
 */
export function extractTeamSubRouteSegment(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/team\/[^/]+\/[^/]+\/([^/]+)$/)
  if (!match) {
    return null
  }

  return decodeURIComponent(match[1])
}

// 05）构建团队空间路径（buildTeamSpacePath）
/**
 * 函数名：buildTeamSpacePath
 * 功能：将 teamUid 与 Tab 映射为 /team/:teamUid 或 /team/:teamUid/:segment。
 * 输入：
 * - teamUid：团队对外 uid
 * - tab：TeamTab，默认主页
 * 输出：
 * - 返回值：路径字符串
 * - 副作用：无
 */
export function buildTeamSpacePath(teamUid: TeamResourceUid, tab: TeamTab = '主页'): string {
  const encodedTeamUid = encodeURIComponent(teamUid)
  const segment = teamTabRouteSegmentByTab[tab]
  if (!segment) {
    return `/team/${encodedTeamUid}`
  }

  return `/team/${encodedTeamUid}/${segment}`
}

// 05.1）构建团队成员管理页路径（buildTeamMembersManagePath）
/**
 * 函数名：buildTeamMembersManagePath
 * 功能：生成团队「管理成员」表单页路径 /team/:teamUid/member/manage。
 * 输入：
 * - teamUid：团队对外 uid
 * 输出：
 * - 返回值：路径字符串
 * - 副作用：无
 */
export function buildTeamMembersManagePath(teamUid: TeamResourceUid): string {
  const encodedTeamUid = encodeURIComponent(teamUid)
  return `/team/${encodedTeamUid}/member/manage`
}

// 05.2）判断是否为管理成员页（isTeamMembersManagePathname）
/**
 * 函数名：isTeamMembersManagePathname
 * 功能：判断当前路径是否为团队成员管理表单页。
 * 输入：
 * - pathname：location.pathname
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function isTeamMembersManagePathname(pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return /^\/team\/[^/]+\/member\/manage$/.test(normalizedPath)
}

// 06）由 pathname 解析 Tab（resolveTeamTabFromPathname）
/**
 * 函数名：resolveTeamTabFromPathname
 * 功能：从团队空间路由解析当前 Tab。
 * 输入：
 * - pathname：location.pathname
 * 输出：
 * - 返回值：TeamTab
 * - 副作用：无
 */
export function resolveTeamTabFromPathname(pathname: string): TeamTab {
  const segment = extractTeamTabRouteSegment(pathname)
  if (!segment) {
    return '主页'
  }

  return teamTabByRouteSegment[segment] ?? '主页'
}

// 07）判断是否为团队空间路由（isTeamSpacePathname）
export function isTeamSpacePathname(pathname: string): boolean {
  return pathname === '/team' || pathname.startsWith('/team/')
}

// 08）校验 Tab 路径段（isSupportedTeamTabRouteSegment）
export function isSupportedTeamTabRouteSegment(
  segment: string | null,
  subSegment: string | null = null,
): boolean {
  if (segment == null) {
    return subSegment == null
  }

  if (!(segment in teamTabByRouteSegment)) {
    return false
  }

  if (subSegment == null) {
    return true
  }

  if (segment === 'member') {
    return subSegment === 'manage'
  }

  return false
}
