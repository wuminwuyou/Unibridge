// 01）个人空间大部件 Hook（usePersonalSpaceWidget）
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { LevelCode } from '@shared/types/level'
import type { UserResourceUid, TeamResourceUid } from '@shared/api/resourceUid'
import type { ProfileSpaceShellLoadState } from '../lib/profileSpaceVariant'
import {
  PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS,
} from '../lib/profileSpaceTabConstants'
import {
  buildPersonalSpacePath, extractPersonalProfileUidFromSearch, extractPersonalTabRouteSegment,
  isSupportedPersonalTabRouteSegment, personalViewTabs, resolvePersonalTabFromLegacySearch,
  resolvePersonalTabFromPathname, type PersonalProfileTab,
} from '../lib/personalTabRouting'

// 02）个人空间核心档案（PersonalSpaceCoreProfile）
export interface PersonalSpaceCoreProfile {
  uid: UserResourceUid
  nickname: string
  avatarUrl: string | null
  isVerified: boolean
  organizationName: string | null
  position: string
  bio: string
  level: LevelCode | null
}

// 03）个人空间扩展档案（PersonalSpaceExtendedProfile）
export interface PersonalSpaceExtendedProfile {
  notice: string
  ipLocation: string
  joinDate: string
  careerData: string[]
  skills: string[]
}

// 04）个人空间关联团队项（PersonalSpaceAssociatedTeam）
export interface PersonalSpaceAssociatedTeam {
  teamUid: TeamResourceUid
  name: string
  description: string
  entryPath: string
}

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
  renderMainContent: () => ReactNode
}

// 06）头像占位地址（buildAvatarFallbackUrl）— 与原 PersonalView 保持一致
function buildAvatarFallbackUrl(nickname: string): string {
  const seed = encodeURIComponent(nickname.trim().slice(0, 1) || 'U')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=cbd5e1&color=ffffff`
}

// 07）个人空间大部件 Hook（usePersonalSpaceWidget）
/**
 * 函数名：usePersonalSpaceWidget
 * 功能：聚合个人空间页的 Tab 路由解析、页壳数据加载、侧栏折叠与主内容分发。
 * 实现方法：
 * - 解析 location.pathname + ?uid= 得到 activeTab 与 profileUidFromQuery
 * - 调用 entities/user/api 中的 getUserProfileSpace（待补：TODO 已下沉至 entities/user）
 * - 项目/笔记 Tab 时自动折叠并延迟卸载侧栏
 * - renderMainContent 按 activeTab 返回主区域 ReactNode（TabContent 由 widgets 内组合）
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

  // 11）拉取个人空间页壳数据 — TODO：迁移完成后启用 entities/user/api/getUserProfileSpace
  useEffect(() => {
    let isCancelled = false
    async function loadShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)
      try {
        // TODO（个人空间 API 迁移）：
        // - 在 entities/user/api/userProfileApi.ts 内实现 getUserProfileSpace(profileUid?) 与 mapUserProfileSpaceData
        // - 此处替换为：const data = await getUserProfileSpace(profileUidFromQuery ?? undefined)
        //   const mapped = mapUserProfileSpaceData(data)
        // - 同步在 shared/lib/tokenStorage 调用 setUserUid 持久化
        await new Promise((resolve) => setTimeout(resolve, 0))
        if (isCancelled) return
        setUserCoreProfile(null)
        setUserExtendedProfile(null)
        setAssociatedTeams([])
        setActivityHeatmap([])
        setHonors([])
        setShellLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setShellErrorMessage(error instanceof Error ? error.message : '加载个人空间失败，请稍后重试')
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

  // 12）主内容渲染分发 — TODO：迁移 PersonalHomeTab / PersonalProjectsTab / PersonalNotesTab 到 widgets/profile-space/components/ 后接入
  const renderMainContent = (): ReactNode => {
    // 占位：TabContent 完成迁移后在此 switch (activeTab) 渲染对应组件
    return null
  }

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
    renderMainContent,
  }
}
