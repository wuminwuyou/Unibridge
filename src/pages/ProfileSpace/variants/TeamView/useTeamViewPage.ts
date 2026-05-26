import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getTeamProfileSpace, TeamProfileApiError } from '../../../../api/teamProfile'
import type { ProfileSpaceShellLoadState } from '../../profileSpaceShellTypes'
import { mapTeamProfileSpaceData } from './mapTeamProfileSpaceData'
import {
  buildTeamMembersManagePath,
  buildTeamSpacePath,
  extractTeamSubRouteSegment,
  extractTeamTabRouteSegment,
  extractTeamUidFromPathname,
  isSupportedTeamTabRouteSegment,
  isTeamMembersManagePathname,
  resolveTeamTabFromPathname,
} from './teamTabRouting'
import { PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS } from '../../profileSpaceTabConstants'
import { teamViewTabs } from './types'
import type { TeamCoreProfile, TeamExtendedProfile, TeamInfoRow, TeamMemberItem, TeamTab } from './types'

// 01）团队空间视图 Hook（useTeamViewPage）
/**
 * 函数名：useTeamViewPage
 * 功能：聚合 TeamView 的 Tab 切换、页壳数据加载、侧栏折叠与布局派生状态。
 * 实现方法：
 * - 从路由解析 teamUid 与 activeTab
 * - 挂载时请求 GET /team-profile/space 并映射页壳视图模型
 * - 各 Tab 内容由 useTeamViewTabData 按 Tab 懒加载
 * 输入：无
 * 输出：
 * - 返回值：TeamViewModel
 * - 副作用：路由跳转、发起网络请求、控制滚动位置
 */
export function useTeamViewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { teamUid: teamUidParam } = useParams<{ teamUid: string }>()

  const teamUid = useMemo(() => {
    return teamUidParam?.trim() || extractTeamUidFromPathname(location.pathname) || ''
  }, [location.pathname, teamUidParam])

  const activeTab = useMemo<TeamTab>(() => resolveTeamTabFromPathname(location.pathname), [location.pathname])

  const [shellLoadState, setShellLoadState] = useState<ProfileSpaceShellLoadState>('loading')
  const [shellErrorMessage, setShellErrorMessage] = useState<string | null>(null)
  const [teamCoreProfile, setTeamCoreProfile] = useState<TeamCoreProfile | null>(null)
  const [teamExtendedProfile, setTeamExtendedProfile] = useState<TeamExtendedProfile | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([])
  const [teamInfoRows, setTeamInfoRows] = useState<TeamInfoRow[]>([])

  const isProjectTabActive = activeTab === '项目'
  const isNotesTabActive = activeTab === '笔记'
  const isMembersTabActive = activeTab === '成员'
  const isMembersManageActive = isMembersTabActive && isTeamMembersManagePathname(location.pathname)
  const isAchievementsTabActive = activeTab === '成果'
  const isSidebarCollapsed =
    isProjectTabActive || isNotesTabActive || isMembersTabActive || isAchievementsTabActive
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
    if (!teamUid) {
      navigate('/profile', { replace: true })
      return
    }

    const segment = extractTeamTabRouteSegment(location.pathname)
    const subSegment = extractTeamSubRouteSegment(location.pathname)

    if (!isSupportedTeamTabRouteSegment(segment, subSegment)) {
      navigate(buildTeamSpacePath(teamUid), { replace: true })
    }
  }, [location.pathname, navigate, teamUid])

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
    if (!teamUid) {
      return
    }

    let isCancelled = false

    async function loadTeamViewShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)

      try {
        const spaceData = await getTeamProfileSpace(teamUid)
        if (isCancelled) {
          return
        }

        const mappedSpaceData = mapTeamProfileSpaceData(spaceData)
        setTeamCoreProfile(mappedSpaceData.teamCoreProfile)
        setTeamExtendedProfile(mappedSpaceData.teamExtendedProfile)
        setTeamMembers(mappedSpaceData.teamMembers)
        setTeamInfoRows(mappedSpaceData.teamInfoRows)
        setShellLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const errorMessage =
          error instanceof TeamProfileApiError
            ? error.message
            : '加载团队空间失败，请稍后重试'
        setShellErrorMessage(errorMessage)
        setShellLoadState('error')
      }
    }

    void loadTeamViewShell()

    return () => {
      isCancelled = true
    }
  }, [teamUid])

  const isShellReady =
    shellLoadState === 'ready' &&
    teamCoreProfile != null &&
    teamExtendedProfile != null

  const heroLogoUrl = teamCoreProfile
    ? teamCoreProfile.logoUrl ??
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(teamCoreProfile.name.slice(0, 2))}&backgroundColor=cbd5e1&color=ffffff`
    : ''

  const handleTabClick = (tab: TeamTab): void => {
    if (!teamUid) {
      return
    }

    const targetPath = buildTeamSpacePath(teamUid, tab)
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const handleManageMembersClick = (): void => {
    if (!teamUid) {
      return
    }

    const targetPath = buildTeamMembersManagePath(teamUid)
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const handleExitMembersManage = (): void => {
    handleTabClick('成员')
  }

  const isHomeTabActive = activeTab === '主页'

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
    heroLogoUrl,
    isHomeTabActive,
    handleTabClick,
    handleManageMembersClick,
    handleExitMembersManage,
  }
}

export type TeamViewModel = ReturnType<typeof useTeamViewPage>
