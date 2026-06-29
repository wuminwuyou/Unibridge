// 01）机构空间大部件 Hook（useOrganizationSpaceWidget）
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { EntityCode } from '@shared/api/resourceUid'
import type { ProfileOrgMemberItem } from '@entities/member/model'
import {
  EntityProfileApiError, getEntityProfileSpace,
} from '@entities/organization/api/entityProfileApi'
import {
  buildOrganizationLogoFallbackUrl, mapEntityProfileSpaceData,
  type OrganizationProfileCoreVm, type OrganizationProfileExtendedVm,
  type OrganizationProfileInfoRowVm, type OrganizationProfileTeamItemVm,
} from '@entities/organization/lib/mapEntityProfileSpaceData'
import type { ProfileSpaceShellLoadState } from '../lib/profileSpaceVariant'
import { PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS } from '../lib/profileSpaceTabConstants'
import {
  buildOrganizationSpacePath, extractEntityCodeFromSearch, extractOrganizationTabRouteSegment,
  isSupportedOrganizationTabRouteSegment, organizationViewTabs, resolveLegacyOrganizationSpaceRedirect,
  resolveOrganizationTabFromPathname, type OrganizationProfileTab,
} from '../lib/organizationTabRouting'

// 02）类型别名（保持外部 API 稳定）
export type OrganizationSpaceCoreProfile = OrganizationProfileCoreVm
export type OrganizationSpaceExtendedProfile = OrganizationProfileExtendedVm
export type OrganizationSpaceInfoRow = OrganizationProfileInfoRowVm
export type OrganizationSpaceTeamItem = OrganizationProfileTeamItemVm

// 05）机构空间大部件 Model（OrganizationSpaceWidgetModel）
export interface OrganizationSpaceWidgetModel {
  entityCode: EntityCode
  organizationTabs: typeof organizationViewTabs
  activeTab: OrganizationProfileTab
  shellLoadState: ProfileSpaceShellLoadState
  shellErrorMessage: string | null
  orgCoreProfile: OrganizationSpaceCoreProfile | null
  orgExtendedProfile: OrganizationSpaceExtendedProfile | null
  orgInfoRows: OrganizationSpaceInfoRow[]
  orgMembersPreview: ProfileOrgMemberItem[]
  orgTeamsPreview: OrganizationSpaceTeamItem[]
  isHomeTabActive: boolean
  isLabsTabActive: boolean
  isMembersTabActive: boolean
  isProjectTabActive: boolean
  isNotesTabActive: boolean
  isSidebarCollapsed: boolean
  shouldRenderSidebar: boolean
  contentGridClassName: string
  isShellReady: boolean
  heroLogoUrl: string
  handleTabClick: (tab: OrganizationProfileTab) => void
}

// 06）机构空间大部件 Hook（useOrganizationSpaceWidget）
/**
 * 函数名：useOrganizationSpaceWidget
 * 功能：聚合机构空间页的 Tab 路由、页壳数据、侧栏折叠与主内容分发。
 * 实现方法：
 * - 从 ?uid= 解析 entityCode（兼容旧版 ?entityCode=）
 * - supportsLabs 由后端 EntityProfileSpaceData 提供
 * - 主区域内容由 OrganizationSpaceMainContent 在 widget 组件层根据 model 渲染
 * - 管理表单（ManageLabsForm / OrgMembersManageForm）按身份从 features/team-management 注入
 * 输入：无
 * 输出：
 * - 返回值：OrganizationSpaceWidgetModel
 * - 副作用：路由跳转、滚动重置、网络请求
 */
export function useOrganizationSpaceWidget(): OrganizationSpaceWidgetModel {
  const location = useLocation()
  const navigate = useNavigate()

  const entityCode = useMemo<EntityCode>(
    () => extractEntityCodeFromSearch(location.search) ?? '',
    [location.search],
  )

  const [shellLoadState, setShellLoadState] = useState<ProfileSpaceShellLoadState>('loading')
  const [shellErrorMessage, setShellErrorMessage] = useState<string | null>(null)
  const [orgCoreProfile, setOrgCoreProfile] = useState<OrganizationSpaceCoreProfile | null>(null)
  const [orgExtendedProfile, setOrgExtendedProfile] = useState<OrganizationSpaceExtendedProfile | null>(null)
  const [orgInfoRows, setOrgInfoRows] = useState<OrganizationSpaceInfoRow[]>([])
  const [orgMembersPreview, setOrgMembersPreview] = useState<ProfileOrgMemberItem[]>([])
  const [orgTeamsPreview, setOrgTeamsPreview] = useState<OrganizationSpaceTeamItem[]>([])

  const supportsLabs = orgCoreProfile?.supportsLabs ?? true
  const activeTab = useMemo<OrganizationProfileTab>(
    () => resolveOrganizationTabFromPathname(location.pathname, supportsLabs),
    [location.pathname, supportsLabs],
  )

  const isHomeTabActive = activeTab === '主页'
  const isLabsTabActive = activeTab === '实验室'
  const isMembersTabActive = activeTab === '人员'
  const isProjectTabActive = activeTab === '项目'
  const isNotesTabActive = activeTab === '笔记'
  const isSidebarCollapsed = !isHomeTabActive
  const [shouldRenderSidebar, setShouldRenderSidebar] = useState<boolean>(!isSidebarCollapsed)

  const contentGridClassName = useMemo<string>(() => {
    if (!shouldRenderSidebar) return 'profile-content-grid profile-content-grid--single'
    if (isSidebarCollapsed) return 'profile-content-grid profile-content-grid--collapsing'
    return 'profile-content-grid'
  }, [isSidebarCollapsed, shouldRenderSidebar])

  // 07）旧版 /org/:entityCode 路径段重定向 + Tab 路径段校验 + 缺失 entityCode 跳回个人空间
  useEffect(() => {
    const legacyRedirect = resolveLegacyOrganizationSpaceRedirect(location.pathname, location.search)
    if (legacyRedirect != null) {
      navigate(legacyRedirect, { replace: true })
      return
    }
    if (!entityCode) {
      navigate('/profile', { replace: true })
      return
    }
    const segment = extractOrganizationTabRouteSegment(location.pathname)
    if (!isSupportedOrganizationTabRouteSegment(segment, supportsLabs)) {
      navigate(buildOrganizationSpacePath(entityCode), { replace: true })
    }
  }, [entityCode, location.pathname, location.search, navigate, supportsLabs])

  useEffect(() => {
    if (!isSidebarCollapsed) {
      setShouldRenderSidebar(true)
      return
    }
    const timeoutId = window.setTimeout(() => setShouldRenderSidebar(false), PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [isSidebarCollapsed])

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  // 08）拉取机构空间页壳数据（GET /entity-profile/space）
  useEffect(() => {
    if (!entityCode) return
    let isCancelled = false
    async function loadShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)
      try {
        const data = await getEntityProfileSpace(entityCode)
        if (isCancelled) return
        const mapped = mapEntityProfileSpaceData(data)
        setOrgCoreProfile(mapped.orgCoreProfile)
        setOrgExtendedProfile(mapped.orgExtendedProfile)
        setOrgInfoRows(mapped.orgInfoRows)
        setOrgMembersPreview(mapped.orgMembersPreview)
        setOrgTeamsPreview(mapped.orgTeamsPreview)
        setShellLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        const message =
          error instanceof EntityProfileApiError ? error.message : '加载机构空间失败，请稍后重试'
        setShellErrorMessage(message)
        setShellLoadState('error')
      }
    }
    void loadShell()
    return () => { isCancelled = true }
  }, [entityCode])

  const isShellReady = shellLoadState === 'ready' && orgCoreProfile != null

  const heroLogoUrl = orgCoreProfile
    ? orgCoreProfile.logoUrl ?? buildOrganizationLogoFallbackUrl(orgCoreProfile.name)
    : ''

  const handleTabClick = (tab: OrganizationProfileTab): void => {
    if (!entityCode) return
    const targetPath = buildOrganizationSpacePath(entityCode, tab)
    const currentPath = `${location.pathname}${location.search}`
    if (currentPath !== targetPath) navigate(targetPath)
  }

  return {
    entityCode,
    organizationTabs: organizationViewTabs,
    activeTab,
    shellLoadState,
    shellErrorMessage,
    orgCoreProfile,
    orgExtendedProfile,
    orgInfoRows,
    orgMembersPreview,
    orgTeamsPreview,
    isHomeTabActive,
    isLabsTabActive,
    isMembersTabActive,
    isProjectTabActive,
    isNotesTabActive,
    isSidebarCollapsed,
    shouldRenderSidebar,
    contentGridClassName,
    isShellReady,
    heroLogoUrl,
    handleTabClick,
  }
}
