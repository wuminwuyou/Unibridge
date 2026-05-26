import type { OrganizationTab } from './types'

// 01）Tab 对应 URL 路径段（organizationTabRouteSegmentByTab）
export const organizationTabRouteSegmentByTab: Record<OrganizationTab, string | null> = {
  主页: null,
  实验室: 'lab',
  人员: 'member',
  项目: 'project',
  笔记: 'note',
}

// 02）URL 路径段对应 Tab（organizationTabByRouteSegment）
export const organizationTabByRouteSegment: Record<string, OrganizationTab> = {
  lab: '实验室',
  member: '人员',
  project: '项目',
  note: '笔记',
}

// 03）解析机构主体代码（extractEntityCodeFromPathname）
/**
 * 函数名：extractEntityCodeFromPathname
 * 功能：从 /org/:entityCode 或 /org/:entityCode/:tab 解析 entityCode。
 * 输入：
 * - pathname：location.pathname
 * 输出：
 * - 返回值：EntityCode | null
 * - 副作用：无
 */
export function extractEntityCodeFromPathname(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/org\/([^/]+)(?:\/[^/]+)?$/)
  if (!match) {
    return null
  }

  const entityCode = decodeURIComponent(match[1])
  return entityCode.trim().length > 0 ? entityCode : null
}

// 04）解析 Tab 路径段（extractOrganizationTabRouteSegment）
export function extractOrganizationTabRouteSegment(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/org\/[^/]+\/([^/]+)$/)
  if (!match) {
    return null
  }

  return decodeURIComponent(match[1])
}

// 05）构建机构空间路径（buildOrganizationSpacePath）
/**
 * 函数名：buildOrganizationSpacePath
 * 功能：将 entityCode 与 Tab 映射为 /org/:entityCode 或 /org/:entityCode/:segment。
 * 输入：
 * - entityCode：机构主体代码
 * - tab：OrganizationTab，默认主页
 * 输出：
 * - 返回值：路径字符串
 * - 副作用：无
 */
export function buildOrganizationSpacePath(entityCode: string, tab: OrganizationTab = '主页'): string {
  const encodedEntityCode = encodeURIComponent(entityCode)
  const segment = organizationTabRouteSegmentByTab[tab]
  if (!segment) {
    return `/org/${encodedEntityCode}`
  }

  return `/org/${encodedEntityCode}/${segment}`
}

// 06）校验 Tab 路径段（isSupportedOrganizationTabRouteSegment）
/**
 * 函数名：isSupportedOrganizationTabRouteSegment
 * 功能：校验 URL 路径段是否为当前机构类型允许的 Tab。
 * 实现方法：
 * - 企业等不支持实验室时，拒绝 lab 路径段
 * - 其余路径段按 organizationTabByRouteSegment 白名单校验
 * 输入：
 * - segment：URL Tab 路径段
 * - supportsLabs：是否允许访问实验室 Tab
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function isSupportedOrganizationTabRouteSegment(
  segment: string | null,
  supportsLabs: boolean,
): boolean {
  if (segment == null) {
    return true
  }

  if (segment === 'lab' && !supportsLabs) {
    return false
  }

  return segment in organizationTabByRouteSegment
}

// 07）由 pathname 解析 Tab（resolveOrganizationTabFromPathname）
/**
 * 函数名：resolveOrganizationTabFromPathname
 * 功能：从机构空间路由解析当前 Tab，并按 supportsLabs 过滤无效 Tab。
 * 输入：
 * - pathname：location.pathname
 * - supportsLabs：是否允许实验室 Tab
 * 输出：
 * - 返回值：OrganizationTab
 * - 副作用：无
 */
export function resolveOrganizationTabFromPathname(
  pathname: string,
  supportsLabs: boolean,
): OrganizationTab {
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
