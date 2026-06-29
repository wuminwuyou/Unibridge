// 01）团队空间大部件 Hook（useTeamSpaceWidget）
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import type { ProfileMemberItem } from '@entities/member/model'
import {
  getTeamProfileSpace, TeamProfileApiError,
} from '@entities/team/api/teamProfileApi'
import {
  buildTeamLogoFallbackUrl, mapTeamProfileSpaceData,
  type TeamProfileCoreVm, type TeamProfileExtendedVm, type TeamProfileInfoRowVm,
} from '@entities/team/lib/mapTeamProfileSpaceData'
import type { ProfileSpaceShellLoadState } from '../lib/profileSpaceVariant'
import { PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS } from '../lib/profileSpaceTabConstants'
import {
  buildTeamMembersManagePath, buildTeamSpacePath, extractTeamSubRouteSegment,
  extractTeamTabRouteSegment, extractTeamUidFromSearch, isSupportedTeamTabRouteSegment,
  isTeamMembersManagePathname, resolveLegacyTeamSpaceRedirect, resolveTeamTabFromPathname,
  teamViewTabs, type TeamProfileTab,
} from '../lib/teamTabRouting'

// 02）类型别名（保持外部 API 稳定）
export type TeamSpaceCoreProfile = TeamProfileCoreVm
export type TeamSpaceExtendedProfile = TeamProfileExtendedVm
export type TeamSpaceInfoRow = TeamProfileInfoRowVm

// 05）团队空间大部件 Model（TeamSpaceWidgetModel）
export interface TeamSpaceWidgetModel {
  teamUid: TeamResourceUid
  teamTabs: typeof teamViewTabs
  activeTab: TeamProfileTab
  shellLoadState: ProfileSpaceShellLoadState
  shellErrorMessage: string | null
  teamCoreProfile: TeamSpaceCoreProfile | null
  teamExtendedProfile: TeamSpaceExtendedProfile | null
  teamMembers: ProfileMemberItem[]
  teamInfoRows: TeamSpaceInfoRow[]
  isProjectTabActive: boolean
  isNotesTabActive: boolean
  isMembersTabActive: boolean
  isMembersManageActive: boolean
  isAchievementsTabActive: boolean
  isSidebarCollapsed: boolean
  shouldRenderSidebar: boolean
  contentGridClassName: string
  isShellReady: boolean
  isHomeTabActive: boolean
  heroLogoUrl: string
  handleTabClick: (tab: TeamProfileTab) => void
  handleManageMembersClick: () => void
  handleExitMembersManage: () => void
}

// 06）团队空间大部件 Hook（useTeamSpaceWidget）
/**
 * 函数名：useTeamSpaceWidget
 * 功能：聚合团队空间页的 Tab 路由、页壳数据加载、侧栏折叠、成员管理模式切换。
 * 实现方法：
 * - 从 ?uid= 解析 teamUid，从 pathname 解析 activeTab
 * - 调用 entities/team/api 中的 getTeamProfileSpace
 * - handleManageMembersClick 跳转 /team/member/manage?uid=<teamUid> 进入管理表单（Feature 注入）
 * - 主区域内容由 TeamSpaceMainContent 在 widget 组件层根据 model 渲染
 * 输入：无
 * 输出：
 * - 返回值：TeamSpaceWidgetModel
 * - 副作用：路由跳转、滚动重置、网络请求
 */
export function useTeamSpaceWidget(): TeamSpaceWidgetModel {
  const location = useLocation()
  const navigate = useNavigate()

  const teamUid = useMemo<TeamResourceUid>(
    () => extractTeamUidFromSearch(location.search) ?? '',
    [location.search],
  )

  const activeTab = useMemo<TeamProfileTab>(
    () => resolveTeamTabFromPathname(location.pathname),
    [location.pathname],
  )

  const [shellLoadState, setShellLoadState] = useState<ProfileSpaceShellLoadState>('loading')
  const [shellErrorMessage, setShellErrorMessage] = useState<string | null>(null)
  const [teamCoreProfile, setTeamCoreProfile] = useState<TeamSpaceCoreProfile | null>(null)
  const [teamExtendedProfile, setTeamExtendedProfile] = useState<TeamSpaceExtendedProfile | null>(null)
  const [teamMembers, setTeamMembers] = useState<ProfileMemberItem[]>([])
  const [teamInfoRows, setTeamInfoRows] = useState<TeamSpaceInfoRow[]>([])

  const isProjectTabActive = activeTab === '项目'
  const isNotesTabActive = activeTab === '笔记'
  const isMembersTabActive = activeTab === '成员'
  const isMembersManageActive = isMembersTabActive && isTeamMembersManagePathname(location.pathname)
  const isAchievementsTabActive = activeTab === '成果'
  const isHomeTabActive = activeTab === '主页'
  const isSidebarCollapsed =
    isProjectTabActive || isNotesTabActive || isMembersTabActive || isAchievementsTabActive
  const [shouldRenderSidebar, setShouldRenderSidebar] = useState<boolean>(!isSidebarCollapsed)

  const contentGridClassName = useMemo<string>(() => {
    if (!shouldRenderSidebar) return 'profile-content-grid profile-content-grid--single'
    if (isSidebarCollapsed) return 'profile-content-grid profile-content-grid--collapsing'
    return 'profile-content-grid'
  }, [isSidebarCollapsed, shouldRenderSidebar])

  // 07）旧版 /team/:teamUid 路径段重定向 + 缺失 teamUid 跳回个人空间 + Tab 路径段校验
  useEffect(() => {
    const legacyRedirect = resolveLegacyTeamSpaceRedirect(location.pathname, location.search)
    if (legacyRedirect != null) {
      navigate(legacyRedirect, { replace: true })
      return
    }
    if (!teamUid) {
      navigate('/profile', { replace: true })
      return
    }
    const segment = extractTeamTabRouteSegment(location.pathname)
    const subSegment = extractTeamSubRouteSegment(location.pathname)
    if (!isSupportedTeamTabRouteSegment(segment, subSegment)) {
      navigate(buildTeamSpacePath(teamUid), { replace: true })
    }
  }, [location.pathname, location.search, navigate, teamUid])

  useEffect(() => {
    if (!isSidebarCollapsed) {
      setShouldRenderSidebar(true)
      return
    }
    const timeoutId = window.setTimeout(() => setShouldRenderSidebar(false), PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [isSidebarCollapsed])

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  // 08）拉取团队空间页壳数据（GET /team-profile/space）
  useEffect(() => {
    if (!teamUid) return
    let isCancelled = false
    async function loadShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)
      try {
        const data = await getTeamProfileSpace(teamUid)
        if (isCancelled) return
        const mapped = mapTeamProfileSpaceData(data)
        setTeamCoreProfile(mapped.teamCoreProfile)
        setTeamExtendedProfile(mapped.teamExtendedProfile)
        setTeamMembers(mapped.teamMembers)
        setTeamInfoRows(mapped.teamInfoRows)
        setShellLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        const message =
          error instanceof TeamProfileApiError ? error.message : '加载团队空间失败，请稍后重试'
        setShellErrorMessage(message)
        setShellLoadState('error')
      }
    }
    void loadShell()
    return () => { isCancelled = true }
  }, [teamUid])

  const isShellReady =
    shellLoadState === 'ready' && teamCoreProfile != null && teamExtendedProfile != null

  const heroLogoUrl = teamCoreProfile
    ? teamCoreProfile.logoUrl ?? buildTeamLogoFallbackUrl(teamCoreProfile.name)
    : ''

  const handleTabClick = (tab: TeamProfileTab): void => {
    if (!teamUid) return
    const targetPath = buildTeamSpacePath(teamUid, tab)
    const currentPath = `${location.pathname}${location.search}`
    if (currentPath !== targetPath) navigate(targetPath)
  }

  const handleManageMembersClick = (): void => {
    if (!teamUid) return
    const targetPath = buildTeamMembersManagePath(teamUid)
    const currentPath = `${location.pathname}${location.search}`
    if (currentPath !== targetPath) navigate(targetPath)
  }

  const handleExitMembersManage = (): void => {
    handleTabClick('成员')
  }

  return {
    teamUid,
    teamTabs: teamViewTabs,
    activeTab,
    shellLoadState,
    shellErrorMessage,
    teamCoreProfile,
    teamExtendedProfile,
    teamMembers,
    teamInfoRows,
    isProjectTabActive,
    isNotesTabActive,
    isMembersTabActive,
    isMembersManageActive,
    isAchievementsTabActive,
    isSidebarCollapsed,
    shouldRenderSidebar,
    contentGridClassName,
    isShellReady,
    isHomeTabActive,
    heroLogoUrl,
    handleTabClick,
    handleManageMembersClick,
    handleExitMembersManage,
  }
}
