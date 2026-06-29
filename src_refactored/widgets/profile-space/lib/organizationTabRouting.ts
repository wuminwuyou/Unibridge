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

// 03）从 /org/:entityCode[/...] 解析 entityCode（extractEntityCodeFromPathname）
export function extractEntityCodeFromPathname(pathname: string): EntityCode | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/org\/([^/]+)(?:\/[^/]+)?$/)
  if (!match) return null
  const entityCode = decodeURIComponent(match[1])
  return entityCode.trim().length > 0 ? entityCode : null
}

// 04）解析 Tab 路径段（extractOrganizationTabRouteSegment）
export function extractOrganizationTabRouteSegment(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const match = normalizedPath.match(/^\/org\/[^/]+\/([^/]+)$/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

// 05）构建机构空间路径（buildOrganizationSpacePath）
export function buildOrganizationSpacePath(entityCode: EntityCode, tab: OrganizationProfileTab = '主页'): string {
  const encodedEntityCode = encodeURIComponent(entityCode)
  const segment = organizationTabRouteSegmentByTab[tab]
  if (!segment) return `/org/${encodedEntityCode}`
  return `/org/${encodedEntityCode}/${segment}`
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
