// 01）空间页统筹与变体数据 Hook 集合（useProfileSpaceWidget）
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  isUserResourceUid, type EntityCode, type TeamResourceUid, type UserResourceUid,
} from '@shared/api/resourceUid'
import { setUserUid } from '@shared/lib/tokenStorage'
import {
  EntityProfileApiError, getEntityProfileSpace,
} from '@entities/organization/api/entityProfileApi'
import {
  buildOrganizationLogoFallbackUrl, mapEntityProfileSpaceData,
  type OrganizationProfileCoreVm, type OrganizationProfileExtendedVm,
  type OrganizationProfileInfoRowVm, type OrganizationProfileTeamItemVm,
} from '@entities/organization/lib/mapEntityProfileSpaceData'
import type { ProfileOrgMemberItem } from '@entities/member/model'
import {
  getTeamProfileSpace, TeamProfileApiError,
} from '@entities/team/api/teamProfileApi'
import {
  buildTeamLogoFallbackUrl, mapTeamProfileSpaceData,
  type TeamProfileCoreVm, type TeamProfileExtendedVm, type TeamProfileInfoRowVm,
} from '@entities/team/lib/mapTeamProfileSpaceData'
import type { ProfileMemberItem } from '@entities/member/model'
import {
  getUserProfileSpace, UserProfileApiError,
} from '@entities/user/api/userProfileApi'
import {
  buildAvatarFallbackUrl, mapUserProfileSpaceData,
  type UserProfileCoreProfile, type UserProfileExtendedProfile,
} from '@entities/user/lib/mapUserProfileSpaceData'
import type { UserProfileSpaceAssociatedTeam } from '@entities/user/model/userProfileTypes'
import {
  buildOrganizationSpacePath, extractEntityCodeFromSearch, extractOrganizationTabRouteSegment,
  isSupportedOrganizationTabRouteSegment, organizationViewTabs, resolveLegacyOrganizationSpaceRedirect,
  resolveOrganizationTabFromPathname, type OrganizationProfileTab,
} from '@features/profile-space/lib/routing/organizationTabRouting'
import {
  buildPersonalSpacePath, extractPersonalProfileUidFromSearch, extractPersonalTabRouteSegment,
  isSupportedPersonalTabRouteSegment, personalViewTabs, resolvePersonalTabFromLegacySearch,
  resolvePersonalTabFromPathname, type PersonalProfileTab,
} from '@features/profile-space/lib/routing/personalTabRouting'
import {
  buildTeamMembersManagePath, buildTeamSpacePath, extractTeamSubRouteSegment,
  extractTeamTabRouteSegment, extractTeamUidFromSearch, isSupportedTeamTabRouteSegment,
  isTeamMembersManagePathname, resolveLegacyTeamSpaceRedirect, resolveTeamTabFromPathname,
  teamViewTabs, type TeamProfileTab,
} from '@features/profile-space/lib/routing/teamTabRouting'
import {
  resolveProfileSpaceVariant, type ProfileSpaceShellLoadState, type ProfileSpaceVariant,
} from '@features/profile-space/lib/profileSpaceVariant'
import {
  PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS,
} from '@features/profile-space/constants/profileSpaceTabConstants'

// 02）变体类型别名（保持外部 API 不变）
export type PersonalSpaceCoreProfile = UserProfileCoreProfile
export type PersonalSpaceExtendedProfile = UserProfileExtendedProfile
export type PersonalSpaceAssociatedTeam = UserProfileSpaceAssociatedTeam
export type TeamSpaceCoreProfile = TeamProfileCoreVm
export type TeamSpaceExtendedProfile = TeamProfileExtendedVm
export type TeamSpaceInfoRow = TeamProfileInfoRowVm
export type OrganizationSpaceCoreProfile = OrganizationProfileCoreVm
export type OrganizationSpaceExtendedProfile = OrganizationProfileExtendedVm
export type OrganizationSpaceInfoRow = OrganizationProfileInfoRowVm
export type OrganizationSpaceTeamItem = OrganizationProfileTeamItemVm

// 03）空间页统筹 Hook 入参/返回（UseProfileSpaceWidget*）
interface UseProfileSpaceWidgetOptions {
  variant?: ProfileSpaceVariant
}

export interface UseProfileSpaceWidgetResult {
  variant: ProfileSpaceVariant
  pathname: string
}

// 04）空间页统筹 Hook（useProfileSpaceWidget）
/**
 * 函数名：useProfileSpaceWidget
 * 功能：判定当前空间页应渲染的变体（个人 / 团队 / 机构）。
 * 实现方法：
 * - 优先使用页面层显式注入的 variant
 * - 否则按 location.pathname 解析（/profile → personal / /team → team / /org → organization）
 * 输入：
 * - options.variant：可选，页面层强制变体
 * 输出：
 * - 返回值：{ variant, pathname }
 * - 副作用：无
 */
export function useProfileSpaceWidget(
  options: UseProfileSpaceWidgetOptions = {},
): UseProfileSpaceWidgetResult {
  const location = useLocation()
  const resolvedVariant = options.variant ?? resolveProfileSpaceVariant(location.pathname)
  return {
    variant: resolvedVariant,
    pathname: location.pathname,
  }
}

// 05）个人空间变体数据 Model（PersonalSpaceVariantModel）
export interface PersonalSpaceVariantModel {
  profileTabs: typeof personalViewTabs
  activeTab: PersonalProfileTab
  profileUidFromQuery: UserResourceUid | null
  shellLoadState: ProfileSpaceShellLoadState
  shellErrorMessage: string | null
  userCoreProfile: PersonalSpaceCoreProfile | null
  userExtendedProfile: PersonalSpaceExtendedProfile | null
  associatedTeams: PersonalSpaceAssociatedTeam[]
  activityHeatmap: number[]
  honors: unknown[]
  isSidebarCollapsed: boolean
  shouldRenderSidebar: boolean
  contentGridClassName: string
  isShellReady: boolean
  heroAvatarUrl: string
  isHomeLikeTabActive: boolean
  handleTabClick: (tab: PersonalProfileTab) => void
}

// 06）个人空间变体数据 Hook（usePersonalSpaceVariantData）
/**
 * 函数名：usePersonalSpaceVariantData
 * 功能：聚合个人空间的路由解析、页壳数据加载、侧栏折叠与 Tab 切换。
 * 实现方法：
 * - 从 location.pathname 解析 activeTab、从 ?uid= 解析 profileUidFromQuery
 * - 调用 entities/user/api/getUserProfileSpace + mapUserProfileSpaceData
 * - 项目/笔记 Tab 时自动折叠并延迟卸载侧栏
 * 输入：无
 * 输出：
 * - 返回值：PersonalSpaceVariantModel
 * - 副作用：发起网络请求、路由跳转、滚动重置、写入 tokenStorage
 */
export function usePersonalSpaceVariantData(): PersonalSpaceVariantModel {
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = useMemo<PersonalProfileTab>(
    () => resolvePersonalTabFromPathname(location.pathname),
    [location.pathname],
  )

  const profileUidFromQuery = useMemo(
    () => extractPersonalProfileUidFromSearch(location.search),
    [location.search],
  )

  const [shellLoadState, setShellLoadState] = useState<ProfileSpaceShellLoadState>('loading')
  const [shellErrorMessage, setShellErrorMessage] = useState<string | null>(null)
  const [userCoreProfile, setUserCoreProfile] = useState<PersonalSpaceCoreProfile | null>(null)
  const [userExtendedProfile, setUserExtendedProfile] = useState<PersonalSpaceExtendedProfile | null>(null)
  const [associatedTeams, setAssociatedTeams] = useState<PersonalSpaceAssociatedTeam[]>([])
  const [activityHeatmap, setActivityHeatmap] = useState<number[]>([])
  const [honors, setHonors] = useState<unknown[]>([])

  const isProjectTabActive = activeTab === '项目'
  const isNotesTabActive = activeTab === '笔记'
  const isSidebarCollapsed = isProjectTabActive || isNotesTabActive
  const [shouldRenderSidebar, setShouldRenderSidebar] = useState<boolean>(!isSidebarCollapsed)

  const contentGridClassName = useMemo<string>(() => {
    if (!shouldRenderSidebar) return 'profile-content-grid profile-content-grid--single'
    if (isSidebarCollapsed) return 'profile-content-grid profile-content-grid--collapsing'
    return 'profile-content-grid'
  }, [isSidebarCollapsed, shouldRenderSidebar])

  useEffect(() => {
    const legacyTab = resolvePersonalTabFromLegacySearch(location.search)
    if (legacyTab != null) {
      navigate(buildPersonalSpacePath(profileUidFromQuery, legacyTab), { replace: true })
      return
    }
    const segment = extractPersonalTabRouteSegment(location.pathname)
    if (!isSupportedPersonalTabRouteSegment(segment)) {
      navigate(buildPersonalSpacePath(profileUidFromQuery), { replace: true })
    }
  }, [location.pathname, location.search, navigate, profileUidFromQuery])

  useEffect(() => {
    if (!isSidebarCollapsed) {
      setShouldRenderSidebar(true)
      return
    }
    const timeoutId = window.setTimeout(() => setShouldRenderSidebar(false), PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [isSidebarCollapsed])

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname, location.search])

  useEffect(() => {
    let isCancelled = false
    async function loadShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)
      try {
        const data = await getUserProfileSpace(profileUidFromQuery ?? undefined)
        if (isCancelled) return
        const mapped = mapUserProfileSpaceData(data)
        if (!profileUidFromQuery && isUserResourceUid(mapped.userCoreProfile.uid)) {
          setUserUid(mapped.userCoreProfile.uid)
        }
        setUserCoreProfile(mapped.userCoreProfile)
        setUserExtendedProfile(mapped.userExtendedProfile)
        setAssociatedTeams(mapped.associatedTeams)
        setActivityHeatmap(mapped.activityHeatmap)
        setHonors(mapped.honors)
        setShellLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        const message =
          error instanceof UserProfileApiError ? error.message : '加载个人空间失败，请稍后重试'
        setShellErrorMessage(message)
        setShellLoadState('error')
      }
    }
    void loadShell()
    return () => { isCancelled = true }
  }, [profileUidFromQuery])

  const isShellReady = shellLoadState === 'ready' && userCoreProfile != null && userExtendedProfile != null
  const heroAvatarUrl = userCoreProfile
    ? userCoreProfile.avatarUrl ?? buildAvatarFallbackUrl(userCoreProfile.nickname)
    : ''

  const handleTabClick = (tab: PersonalProfileTab): void => {
    const targetPath = buildPersonalSpacePath(profileUidFromQuery, tab)
    const currentPath = `${location.pathname}${location.search}`
    if (currentPath !== targetPath) navigate(targetPath)
  }

  const isHomeLikeTabActive = activeTab === '主页' || activeTab === '收藏' || activeTab === '设置'

  return {
    profileTabs: personalViewTabs,
    activeTab,
    profileUidFromQuery,
    shellLoadState,
    shellErrorMessage,
    userCoreProfile,
    userExtendedProfile,
    associatedTeams,
    activityHeatmap,
    honors,
    isSidebarCollapsed,
    shouldRenderSidebar,
    contentGridClassName,
    isShellReady,
    heroAvatarUrl,
    isHomeLikeTabActive,
    handleTabClick,
  }
}

// 07）团队空间变体数据 Model（TeamSpaceVariantModel）
export interface TeamSpaceVariantModel {
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
  isHomeTabActive: boolean
  isSidebarCollapsed: boolean
  shouldRenderSidebar: boolean
  contentGridClassName: string
  isShellReady: boolean
  heroLogoUrl: string
  handleTabClick: (tab: TeamProfileTab) => void
  handleManageMembersClick: () => void
  handleExitMembersManage: () => void
}

// 08）团队空间变体数据 Hook（useTeamSpaceVariantData）
/**
 * 函数名：useTeamSpaceVariantData
 * 功能：聚合团队空间的路由解析、页壳数据加载、Tab 切换、成员管理路由切换、侧栏折叠。
 * 实现方法：
 * - 解析 ?uid= 与 pathname，得到 teamUid 与 activeTab
 * - 处理旧路径段 teamUid 重定向 + 缺失 teamUid 兜底 + Tab 段校验
 * - 调用 entities/team/api/getTeamProfileSpace + mapTeamProfileSpaceData
 * 输入：无
 * 输出：
 * - 返回值：TeamSpaceVariantModel
 * - 副作用：路由跳转、滚动重置、网络请求
 */
export function useTeamSpaceVariantData(): TeamSpaceVariantModel {
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
    isHomeTabActive,
    isSidebarCollapsed,
    shouldRenderSidebar,
    contentGridClassName,
    isShellReady,
    heroLogoUrl,
    handleTabClick,
    handleManageMembersClick,
    handleExitMembersManage,
  }
}

// 09）机构空间变体数据 Model（OrganizationSpaceVariantModel）
export interface OrganizationSpaceVariantModel {
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

// 10）机构空间变体数据 Hook（useOrganizationSpaceVariantData）
/**
 * 函数名：useOrganizationSpaceVariantData
 * 功能：聚合机构空间的路由解析、页壳数据加载、Tab 切换与侧栏折叠。
 * 实现方法：
 * - 解析 ?uid=（兼容 ?entityCode=）与 pathname，得到 entityCode 与 activeTab
 * - supportsLabs 由后端 EntityProfileSpaceData 提供（决定实验室 Tab 是否可见）
 * - 调用 entities/organization/api/getEntityProfileSpace + mapEntityProfileSpaceData
 * 输入：无
 * 输出：
 * - 返回值：OrganizationSpaceVariantModel
 * - 副作用：路由跳转、滚动重置、网络请求
 */
export function useOrganizationSpaceVariantData(): OrganizationSpaceVariantModel {
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
