import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getUserProfileSpace, UserProfileApiError } from '../../../../api/userProfile'
import { isUserResourceUid } from '../../../../api/resourceUid'
import { setUserUid } from '../../../../auth/tokenStorage'
import type { ProfileSpaceShellLoadState } from '../../profileSpaceShellTypes'
import { buildAvatarFallbackUrl, mapUserProfileSpaceData } from './mapUserProfileSpaceData'
import { personalViewTabs, SIDEBAR_COLLAPSE_DURATION_MS } from './personalViewPageData'
import {
  buildProfileTabPath,
  extractProfileTabRouteSegment,
  isSupportedProfileTabRouteSegment,
  resolveProfileTabFromLegacySearch,
  resolveProfileTabFromPathname,
} from './personalTabRouting'
import type {
  ProfileTab,
  UserAssociatedTeam,
  UserCoreProfile,
  UserExtendedProfile,
} from './types'

// 01）个人用户空间视图 Hook（usePersonalViewPage）
/**
 * 函数名：usePersonalViewPage
 * 功能：聚合 PersonalView 的 Tab 切换、页壳数据加载、侧栏折叠与布局派生状态。
 * 实现方法：
 * - 挂载时请求 GET /user-profile/space 并映射视图模型
 * - 由 URL 路径 /profile[/segment] 驱动 activeTab
 * - 项目/笔记 Tab 激活时折叠并延迟卸载右侧栏
 * 输入：无
 * 输出：
 * - 返回值：PersonalViewModel
 * - 副作用：发起网络请求、路由跳转、控制滚动位置
 */
export function usePersonalViewPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = useMemo<ProfileTab>(
    () => resolveProfileTabFromPathname(location.pathname),
    [location.pathname],
  )

  const [shellLoadState, setShellLoadState] = useState<ProfileSpaceShellLoadState>('loading')
  const [shellErrorMessage, setShellErrorMessage] = useState<string | null>(null)
  const [userCoreProfile, setUserCoreProfile] = useState<UserCoreProfile | null>(null)
  const [userExtendedProfile, setUserExtendedProfile] = useState<UserExtendedProfile | null>(null)
  const [associatedTeams, setAssociatedTeams] = useState<UserAssociatedTeam[]>([])
  const [activityHeatmap, setActivityHeatmap] = useState<number[]>([])
  const [honors, setHonors] = useState<unknown[]>([])

  const isProjectTabActive = activeTab === '项目'
  const isNotesTabActive = activeTab === '笔记'
  const isSidebarCollapsed = isProjectTabActive || isNotesTabActive
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
    const legacyTab = resolveProfileTabFromLegacySearch(location.search)
    if (legacyTab != null) {
      navigate(buildProfileTabPath(legacyTab), { replace: true })
      return
    }

    const segment = extractProfileTabRouteSegment(location.pathname)
    if (!isSupportedProfileTabRouteSegment(segment)) {
      navigate('/profile', { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    if (!isSidebarCollapsed) {
      setShouldRenderSidebar(true)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShouldRenderSidebar(false)
    }, SIDEBAR_COLLAPSE_DURATION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isSidebarCollapsed])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    let isCancelled = false

    async function loadPersonalViewShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)

      try {
        const spaceData = await getUserProfileSpace()
        if (isCancelled) {
          return
        }

        const mappedSpaceData = mapUserProfileSpaceData(spaceData)
        if (isUserResourceUid(mappedSpaceData.userCoreProfile.uid)) {
          setUserUid(mappedSpaceData.userCoreProfile.uid)
        }
        setUserCoreProfile(mappedSpaceData.userCoreProfile)
        setUserExtendedProfile(mappedSpaceData.userExtendedProfile)
        setAssociatedTeams(mappedSpaceData.associatedTeams)
        setActivityHeatmap(mappedSpaceData.activityHeatmap)
        setHonors(mappedSpaceData.honors)
        setShellLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const errorMessage =
          error instanceof UserProfileApiError
            ? error.message
            : '加载个人空间失败，请稍后重试'
        setShellErrorMessage(errorMessage)
        setShellLoadState('error')
      }
    }

    void loadPersonalViewShell()

    return () => {
      isCancelled = true
    }
  }, [])

  const isShellReady =
    shellLoadState === 'ready' &&
    userCoreProfile != null &&
    userExtendedProfile != null

  const heroAvatarUrl = userCoreProfile
    ? userCoreProfile.avatarUrl ?? buildAvatarFallbackUrl(userCoreProfile.nickname)
    : ''

  const handleTabClick = (tab: ProfileTab): void => {
    const targetPath = buildProfileTabPath(tab)
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const isHomeLikeTabActive = activeTab === '主页' || activeTab === '收藏' || activeTab === '设置'

  return {
    profileTabs: personalViewTabs,
    activeTab,
    shellLoadState,
    shellErrorMessage,
    userCoreProfile,
    userExtendedProfile,
    associatedTeams,
    activityHeatmap,
    honors,
    isProjectTabActive,
    isNotesTabActive,
    isSidebarCollapsed,
    shouldRenderSidebar,
    contentGridClassName,
    isShellReady,
    heroAvatarUrl,
    isHomeLikeTabActive,
    handleTabClick,
  }
}

export type PersonalViewModel = ReturnType<typeof usePersonalViewPage>

/** @deprecated 使用 PersonalViewModel */
export type ProfileSpacePageModel = PersonalViewModel

/** @deprecated 使用 usePersonalViewPage */
export const useProfileSpacePage = usePersonalViewPage
