// 01）个人空间大部件 Hook（usePersonalSpaceWidget）
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isUserResourceUid, type UserResourceUid } from '@shared/api/resourceUid'
import { setUserUid } from '@shared/lib/tokenStorage'
import {
  getUserProfileSpace, UserProfileApiError,
} from '@entities/user/api/userProfileApi'
import {
  buildAvatarFallbackUrl, mapUserProfileSpaceData,
  type UserProfileCoreProfile, type UserProfileExtendedProfile,
} from '@entities/user/lib/mapUserProfileSpaceData'
import type { UserProfileSpaceAssociatedTeam } from '@entities/user/model/userProfileTypes'
import type { ProfileSpaceShellLoadState } from '../lib/profileSpaceVariant'
import {
  PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS,
} from '../lib/profileSpaceTabConstants'
import {
  buildPersonalSpacePath, extractPersonalProfileUidFromSearch, extractPersonalTabRouteSegment,
  isSupportedPersonalTabRouteSegment, personalViewTabs, resolvePersonalTabFromLegacySearch,
  resolvePersonalTabFromPathname, type PersonalProfileTab,
} from '../lib/personalTabRouting'

// 02）类型别名（保持外部 API 不变）
export type PersonalSpaceCoreProfile = UserProfileCoreProfile
export type PersonalSpaceExtendedProfile = UserProfileExtendedProfile
export type PersonalSpaceAssociatedTeam = UserProfileSpaceAssociatedTeam

// 05）个人空间大部件 Model（PersonalSpaceWidgetModel）
export interface PersonalSpaceWidgetModel {
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

// 07）个人空间大部件 Hook（usePersonalSpaceWidget）
/**
 * 函数名：usePersonalSpaceWidget
 * 功能：聚合个人空间页的 Tab 路由解析、页壳数据加载、侧栏折叠与主内容分发。
 * 实现方法：
 * - 解析 location.pathname + ?uid= 得到 activeTab 与 profileUidFromQuery
 * - 调用 entities/user/api 中的 getUserProfileSpace
 * - 项目/笔记 Tab 时自动折叠并延迟卸载侧栏
 * - 主区域内容由 PersonalSpaceMainContent 在 widget 组件层根据 model 渲染
 * 输入：无
 * 输出：
 * - 返回值：PersonalSpaceWidgetModel
 * - 副作用：发起 /user-profile/space 请求、路由跳转、滚动重置
 */
export function usePersonalSpaceWidget(): PersonalSpaceWidgetModel {
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

  // 08）路由 segment 校验 / 旧版 ?tab= 兼容
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

  // 09）侧栏折叠延迟卸载
  useEffect(() => {
    if (!isSidebarCollapsed) {
      setShouldRenderSidebar(true)
      return
    }
    const timeoutId = window.setTimeout(() => setShouldRenderSidebar(false), PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [isSidebarCollapsed])

  // 10）路由切换重置滚动
  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname, location.search])

  // 11）拉取个人空间页壳数据（GET /user-profile/space）
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
