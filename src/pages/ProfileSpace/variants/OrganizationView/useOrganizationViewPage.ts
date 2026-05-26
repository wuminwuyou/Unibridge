import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getEntityProfileSpace, EntityProfileApiError } from '../../../../api/entityProfile'
import type { ProfileSpaceShellLoadState } from '../../profileSpaceShellTypes'
import { resolveEntitySupportsLabs } from './entityProfileUtils'
import { mapEntityProfileSpaceData } from './mapEntityProfileSpaceData'
import {
  buildOrganizationSpacePath,
  extractEntityCodeFromPathname,
  extractOrganizationTabRouteSegment,
  isSupportedOrganizationTabRouteSegment,
  resolveOrganizationTabFromPathname,
} from './organizationTabRouting'
import { PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS } from '../../profileSpaceTabConstants'
import { buildOrganizationViewTabs } from './types'
import type {
  OrganizationCoreProfile,
  OrganizationExtendedProfile,
  OrganizationInfoRow,
  OrganizationMemberItem,
  OrganizationTab,
  OrganizationTeamItem,
} from './types'

// 01）机构空间视图 Hook（useOrganizationViewPage）
/**
 * 函数名：useOrganizationViewPage
 * 功能：聚合 OrganizationView 的 Tab 切换、页壳数据加载、侧栏折叠与布局派生状态。
 * 实现方法：
 * - 从路由解析 entityCode 与 activeTab
 * - 按 entityCode 位数判断是否展示实验室 Tab
 * - 挂载时请求 GET /entity-profile/space 并映射页壳视图模型
 * - 各 Tab 内容由 useOrganizationViewTabData 按 Tab 懒加载
 * 输入：无
 * 输出：
 * - 返回值：OrganizationViewModel
 * - 副作用：路由跳转、发起网络请求、控制滚动位置
 */
export function useOrganizationViewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { entityCode: entityCodeParam } = useParams<{ entityCode: string }>()

  const entityCode = useMemo(() => {
    return entityCodeParam?.trim() || extractEntityCodeFromPathname(location.pathname) || ''
  }, [entityCodeParam, location.pathname])

  const supportsLabs = useMemo(() => resolveEntitySupportsLabs(entityCode), [entityCode])

  const organizationTabs = useMemo(
    () => buildOrganizationViewTabs(supportsLabs),
    [supportsLabs],
  )

  const activeTab = useMemo<OrganizationTab>(
    () => resolveOrganizationTabFromPathname(location.pathname, supportsLabs),
    [location.pathname, supportsLabs],
  )

  const [shellLoadState, setShellLoadState] = useState<ProfileSpaceShellLoadState>('loading')
  const [shellErrorMessage, setShellErrorMessage] = useState<string | null>(null)
  const [orgCoreProfile, setOrgCoreProfile] = useState<OrganizationCoreProfile | null>(null)
  const [orgExtendedProfile, setOrgExtendedProfile] = useState<OrganizationExtendedProfile | null>(null)
  const [orgTeamsPreview, setOrgTeamsPreview] = useState<OrganizationTeamItem[]>([])
  const [orgMembersPreview, setOrgMembersPreview] = useState<OrganizationMemberItem[]>([])
  const [orgInfoRows, setOrgInfoRows] = useState<OrganizationInfoRow[]>([])

  const isProjectTabActive = activeTab === '项目'
  const isNotesTabActive = activeTab === '笔记'
  const isLabsTabActive = activeTab === '实验室' && supportsLabs
  const isMembersTabActive = activeTab === '人员'
  const isSidebarCollapsed =
    isProjectTabActive || isNotesTabActive || isLabsTabActive || isMembersTabActive
  const [shouldRenderSidebar, setShouldRenderSidebar] = useState<boolean>(!isSidebarCollapsed)

  const contentGridClassName = useMemo<string>(() => {
    if (!shouldRenderSidebar) {
      return 'profile-content-grid profile-content-grid--single'
    }

    if (isSidebarCollapsed) {
      return 'profile-content-grid profile-content-grid--collapsing'
    }

    return 'profile-content-grid'
  }, [isSidebarCollapsed, shouldRenderSidebar])

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

    const timeoutId = window.setTimeout(() => {
      setShouldRenderSidebar(false)
    }, PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isSidebarCollapsed])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    if (!entityCode) {
      return
    }

    let isCancelled = false

    async function loadOrganizationViewShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)

      try {
        const spaceData = await getEntityProfileSpace(entityCode)
        if (isCancelled) {
          return
        }

        const mappedSpaceData = mapEntityProfileSpaceData(spaceData)
        setOrgCoreProfile(mappedSpaceData.orgCoreProfile)
        setOrgExtendedProfile(mappedSpaceData.orgExtendedProfile)
        setOrgTeamsPreview(mappedSpaceData.orgTeamsPreview)
        setOrgMembersPreview(mappedSpaceData.orgMembersPreview)
        setOrgInfoRows(mappedSpaceData.orgInfoRows)
        setShellLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const errorMessage =
          error instanceof EntityProfileApiError
            ? error.message
            : '加载机构空间失败，请稍后重试'
        setShellErrorMessage(errorMessage)
        setShellLoadState('error')
      }
    }

    void loadOrganizationViewShell()

    return () => {
      isCancelled = true
    }
  }, [entityCode])

  const isShellReady =
    shellLoadState === 'ready' && orgCoreProfile != null && orgExtendedProfile != null

  const heroLogoUrl = orgCoreProfile
    ? orgCoreProfile.logoUrl ??
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(orgCoreProfile.name.slice(0, 2))}&backgroundColor=cbd5e1&color=ffffff`
    : ''

  const handleTabClick = (tab: OrganizationTab): void => {
    if (!entityCode) {
      return
    }

    const targetPath = buildOrganizationSpacePath(entityCode, tab)
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const isHomeTabActive = activeTab === '主页'

  return {
    entityCode,
    supportsLabs,
    organizationTabs,
    activeTab,
    shellLoadState,
    shellErrorMessage,
    orgCoreProfile,
    orgExtendedProfile,
    orgTeamsPreview,
    orgMembersPreview,
    orgInfoRows,
    isProjectTabActive,
    isNotesTabActive,
    isLabsTabActive,
    isMembersTabActive,
    isSidebarCollapsed,
    shouldRenderSidebar,
    contentGridClassName,
    isShellReady,
    heroLogoUrl,
    isHomeTabActive,
    handleTabClick,
  }
}

export type OrganizationViewModel = ReturnType<typeof useOrganizationViewPage>
