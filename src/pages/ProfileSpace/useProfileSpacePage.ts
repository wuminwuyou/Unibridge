import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getUserProfileSpace, UserProfileApiError } from '../../api/userProfile'
import { buildAvatarFallbackUrl, mapUserProfileSpaceData } from './mapUserProfileSpaceData'
import { profileTabs, SIDEBAR_COLLAPSE_DURATION_MS } from './profileSpacePageData'
import { resolveProfileTabFromSearch } from './resolveProfileTabFromSearch'
import type {
  ProfileSpaceShellLoadState,
  ProfileTab,
  UserCoreProfile,
  UserExtendedProfile,
  UserLaboratoryProfile,
} from './types'

// 01）个人空间页面 Hook（useProfileSpacePage）
/**
 * 函数名：useProfileSpacePage
 * 功能：聚合个人空间页的 Tab 切换、页壳数据加载、侧栏折叠与布局派生状态。
 * 实现方法：
 * - 挂载时请求 GET /user-profile/space 并映射视图模型
 * - 同步 URL tab 查询参数与 activeTab
 * - 项目/笔记 Tab 激活时折叠并延迟卸载右侧栏
 * 输入：无
 * 输出：
 * - 返回值：ProfileSpacePageModel
 * - 副作用：发起网络请求、更新组件状态、控制滚动位置
 */
export function useProfileSpacePage() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => resolveProfileTabFromSearch(location.search))
  const [shellLoadState, setShellLoadState] = useState<ProfileSpaceShellLoadState>('loading')
  const [shellErrorMessage, setShellErrorMessage] = useState<string | null>(null)
  const [userCoreProfile, setUserCoreProfile] = useState<UserCoreProfile | null>(null)
  const [userExtendedProfile, setUserExtendedProfile] = useState<UserExtendedProfile | null>(null)
  const [userLaboratoryProfile, setUserLaboratoryProfile] = useState<UserLaboratoryProfile | null>(null)
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
    const routeTab = resolveProfileTabFromSearch(location.search)
    setActiveTab(routeTab)
  }, [location.search])

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
  }, [location.pathname, location.search])

  useEffect(() => {
    let isCancelled = false

    async function loadProfileSpaceShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)

      try {
        const spaceData = await getUserProfileSpace()
        if (isCancelled) {
          return
        }

        const mappedSpaceData = mapUserProfileSpaceData(spaceData)
        setUserCoreProfile(mappedSpaceData.userCoreProfile)
        setUserExtendedProfile(mappedSpaceData.userExtendedProfile)
        setUserLaboratoryProfile(mappedSpaceData.userLaboratoryProfile)
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

    void loadProfileSpaceShell()

    return () => {
      isCancelled = true
    }
  }, [])

  const isShellReady =
    shellLoadState === 'ready' &&
    userCoreProfile != null &&
    userExtendedProfile != null &&
    userLaboratoryProfile != null

  const heroAvatarUrl = userCoreProfile
    ? userCoreProfile.avatarUrl ?? buildAvatarFallbackUrl(userCoreProfile.nickname)
    : ''

  const handleTabClick = (tab: ProfileTab): void => {
    setActiveTab(tab)
  }

  const isHomeLikeTabActive = activeTab === '主页' || activeTab === '收藏' || activeTab === '设置'

  return {
    profileTabs,
    activeTab,
    shellLoadState,
    shellErrorMessage,
    userCoreProfile,
    userExtendedProfile,
    userLaboratoryProfile,
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

export type ProfileSpacePageModel = ReturnType<typeof useProfileSpacePage>
