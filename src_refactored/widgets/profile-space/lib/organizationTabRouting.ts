// 01）机构空间 Tab 列表（organizationViewTabs）
import type { EntityCode } from '@shared/api/resourceUid'

export const organizationViewTabs = ['主页', '实验室', '人员', '项目', '笔记'] as const
export type OrganizationProfileTab = (typeof organizationViewTabs)[number]

// 02）Tab ↔ URL 路径段映射
export const organizationTabRouteSegmentByTab: Record<OrganizationProfileTab, string | null> = {
  主页: null,
  实验室: 'lab',
  人员: 'member',
  项目: 'project',
  笔记: 'note',
}

export const organizationTabByRouteSegment: Record<string, OrganizationProfileTab> = {
  lab: '实验室',
  member: '人员',
  project: '项目',
  note: '笔记',
}

// 03）从 ?uid= 读取主体代码（extractEntityCodeFromSearch）
/**
 * 函数名：extractEntityCodeFromSearch
 * 功能：从 location.search 解析当前机构空间的 entityCode（优先 ?uid=，兼容 ?entityCode=）。
 * 实现方法：
 * - 读取 ?uid= 查询参数（去除空白）
 * - 若无 uid 则回退 ?entityCode=
 * - 不再使用路径段携带 entityCode
 * 输入：
 * - search：location.search
 * 输出：
 * - 返回值：EntityCode | null
 * - 副作用：无
 */
export function extractEntityCodeFromSearch(search: string): EntityCode | null {
  const searchParams = new URLSearchParams(search)
  const uid = searchParams.get('uid')?.trim()
  if (uid && uid.length > 0) return uid
  const entityCode = searchParams.get('entityCode')?.trim()
  return entityCode && entityCode.length > 0 ? entityCode : null
}

// 04）解析 Tab 路径段（extractOrganizationTabRouteSegment）
export function extractOrganizationTabRouteSegment(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  if (normalizedPath === '/org') return null
  const match = normalizedPath.match(/^\/org\/([^/]+)$/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

// 05）构建机构空间路径（buildOrganizationSpacePath）
/**
 * 函数名：buildOrganizationSpacePath
 * 功能：构建 /org[/:segment]?uid=<entityCode> 路径。
 * 输入：
 * - entityCode：机构主体代码（必须）
 * - tab：OrganizationProfileTab，默认主页
 * 输出：
 * - 返回值：路径字符串
 * - 副作用：无
 */
export function buildOrganizationSpacePath(entityCode: EntityCode, tab: OrganizationProfileTab = '主页'): string {
  const segment = organizationTabRouteSegmentByTab[tab]
  const basePath = segment ? `/org/${segment}` : '/org'
  const searchParams = new URLSearchParams()
  searchParams.set('uid', entityCode)
  return `${basePath}?${searchParams.toString()}`
}

// 06）校验 Tab 路径段（isSupportedOrganizationTabRouteSegment）
export function isSupportedOrganizationTabRouteSegment(
  segment: string | null,
  supportsLabs: boolean,
): boolean {
  if (segment == null) return true
  if (segment === 'lab' && !supportsLabs) return false
  return segment in organizationTabByRouteSegment
}

// 07）由 pathname 解析 Tab（resolveOrganizationTabFromPathname）
export function resolveOrganizationTabFromPathname(
  pathname: string,
  supportsLabs: boolean,
): OrganizationProfileTab {
  const segment = extractOrganizationTabRouteSegment(pathname)
  if (!segment || !isSupportedOrganizationTabRouteSegment(segment, supportsLabs)) {
    return '主页'
  }
  return organizationTabByRouteSegment[segment] ?? '主页'
}

// 08）判断是否为机构空间路由（isOrganizationSpacePathname）
export function isOrganizationSpacePathname(pathname: string): boolean {
  return pathname === '/org' || pathname.startsWith('/org/')
}

// 09）旧版 /org/:entityCode[/:tab] 重定向（resolveLegacyOrganizationSpaceRedirect）
/**
 * 函数名：resolveLegacyOrganizationSpaceRedirect
 * 功能：将旧版路径段携带 entityCode 的 URL 重定向为 ?uid= 查询参数形式。
 * 输入：
 * - pathname：location.pathname
 * - search：location.search
 * 输出：
 * - 返回值：新路径或 null（无需重定向）
 * - 副作用：无
 */
export function resolveLegacyOrganizationSpaceRedirect(pathname: string, search: string): string | null {
  if (extractEntityCodeFromSearch(search)) return null

  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  if (normalizedPath === '/org') return null

  const match = normalizedPath.match(/^\/org\/([^/]+)(?:\/([^/]+))?$/)
  if (!match) return null

  const firstSegment = decodeURIComponent(match[1])
  if (firstSegment in organizationTabByRouteSegment) return null

  const entityCode = firstSegment
  const tabSegment = match[2] ? decodeURIComponent(match[2]) : null
  const tab = tabSegment ? (organizationTabByRouteSegment[tabSegment] ?? '主页') : '主页'
  return buildOrganizationSpacePath(entityCode, tab)
}
