// 01）机构空间大部件 Hook（useOrganizationSpaceWidget）
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { EntityCode } from '@shared/api/resourceUid'
import type { ProfileSpaceShellLoadState } from '../lib/profileSpaceVariant'
import { PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS } from '../lib/profileSpaceTabConstants'
import {
  buildOrganizationSpacePath, extractEntityCodeFromPathname, extractOrganizationTabRouteSegment,
  isSupportedOrganizationTabRouteSegment, organizationViewTabs, resolveOrganizationTabFromPathname,
  type OrganizationProfileTab,
} from '../lib/organizationTabRouting'

// 02）机构空间核心档案（OrganizationSpaceCoreProfile）
export interface OrganizationSpaceCoreProfile {
  entityCode: EntityCode
  name: string
  intro: string | null
  typeLabel: string
  type: 'UNIVERSITY' | 'ENTERPRISE'
  logoUrl: string | null
  bannerUrl: string | null
  location: string | null
  memberCount: number
  teamCount: number
  supportsLabs: boolean
}

// 03）机构空间扩展档案（OrganizationSpaceExtendedProfile）
export interface OrganizationSpaceExtendedProfile {
  announcement: string
  contactEmail: string | null
}

// 04）机构信息行（OrganizationSpaceInfoRow）
export interface OrganizationSpaceInfoRow {
  label: string
  value: string
}

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
  renderMainContent: () => ReactNode
}

// 06）机构空间大部件 Hook（useOrganizationSpaceWidget）
/**
 * 函数名：useOrganizationSpaceWidget
 * 功能：聚合机构空间页的 Tab 路由、页壳数据、侧栏折叠与主内容分发。
 * 实现方法：
 * - useParams + extractEntityCodeFromPathname 解析 entityCode
 * - supportsLabs 由后端 EntityProfileSpaceData 提供（待接入 entities/organization/api/entityProfileApi）
 * - 主内容由 renderMainContent 分发，管理表单（ManageLabsForm / OrgMembersManageForm）按身份从 features/team-management 注入
 * 输入：无
 * 输出：
 * - 返回值：OrganizationSpaceWidgetModel
 * - 副作用：路由跳转、滚动重置、网络请求
 */
export function useOrganizationSpaceWidget(): OrganizationSpaceWidgetModel {
  const location = useLocation()
  const navigate = useNavigate()
  const { entityCode: entityCodeParam } = useParams<{ entityCode: string }>()

  const entityCode = useMemo<EntityCode>(
    () => entityCodeParam?.trim() || extractEntityCodeFromPathname(location.pathname) || '',
    [location.pathname, entityCodeParam],
  )

  const [shellLoadState, setShellLoadState] = useState<ProfileSpaceShellLoadState>('loading')
  const [shellErrorMessage, setShellErrorMessage] = useState<string | null>(null)
  const [orgCoreProfile, setOrgCoreProfile] = useState<OrganizationSpaceCoreProfile | null>(null)
  const [orgExtendedProfile, setOrgExtendedProfile] = useState<OrganizationSpaceExtendedProfile | null>(null)
  const [orgInfoRows, setOrgInfoRows] = useState<OrganizationSpaceInfoRow[]>([])

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

  // 07）路由 segment 校验
  useEffect(() => {
    if (!entityCode) {
      navigate('/profile', { replace: true })
      return
    }
    const segment = extractOrganizationTabRouteSegment(location.pathname)
    if (!isSupportedOrganizationTabRouteSegment(segment, supportsLabs)) {
      navigate(buildOrganizationSpacePath(entityCode), { replace: true })
    }
  }, [entityCode, location.pathname, navigate, supportsLabs])

  useEffect(() => {
    if (!isSidebarCollapsed) {
      setShouldRenderSidebar(true)
      return
    }
    const timeoutId = window.setTimeout(() => setShouldRenderSidebar(false), PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [isSidebarCollapsed])

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  // 08）拉取机构空间页壳数据 — TODO：接入 entities/organization/api/getEntityProfileSpace + mapEntityProfileSpaceData
  useEffect(() => {
    if (!entityCode) return
    let isCancelled = false
    async function loadShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)
      try {
        // TODO（机构空间 API 集成）：
        // - 调用 entities/organization/api/entityProfileApi.getEntityProfileSpace(entityCode)
        // - 通过 entities/organization/lib/mapEntityProfileSpaceData(data) 投影到 Widget 视图模型
        await new Promise((resolve) => setTimeout(resolve, 0))
        if (isCancelled) return
        setOrgCoreProfile(null)
        setOrgExtendedProfile(null)
        setOrgInfoRows([])
        setShellLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setShellErrorMessage(error instanceof Error ? error.message : '加载机构空间失败，请稍后重试')
        setShellLoadState('error')
      }
    }
    void loadShell()
    return () => { isCancelled = true }
  }, [entityCode])

  const isShellReady = shellLoadState === 'ready' && orgCoreProfile != null

  const heroLogoUrl = orgCoreProfile
    ? orgCoreProfile.logoUrl ??
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(orgCoreProfile.name.slice(0, 2))}&backgroundColor=cbd5e1&color=ffffff`
    : ''

  const handleTabClick = (tab: OrganizationProfileTab): void => {
    if (!entityCode) return
    const targetPath = buildOrganizationSpacePath(entityCode, tab)
    if (location.pathname !== targetPath) navigate(targetPath)
  }

  const renderMainContent = (): ReactNode => {
    // TODO（机构 Tab 内容）：迁移 OrganizationHomeTab / LabsTab / OrgMembersTab / ProjectsTab / NotesTab
    // 至 widgets/profile-space/components/ 后按 activeTab 分发渲染；管理表单从 features/team-management 注入
    return null
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
    renderMainContent,
  }
}
