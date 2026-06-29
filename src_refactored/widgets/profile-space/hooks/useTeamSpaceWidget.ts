// 01）团队空间大部件 Hook（useTeamSpaceWidget）
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import type { ProfileMemberItem } from '@entities/member/model'
import type { ProfileSpaceShellLoadState } from '../lib/profileSpaceVariant'
import { PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS } from '../lib/profileSpaceTabConstants'
import {
  buildTeamMembersManagePath, buildTeamSpacePath, extractTeamSubRouteSegment,
  extractTeamTabRouteSegment, extractTeamUidFromPathname, isSupportedTeamTabRouteSegment,
  isTeamMembersManagePathname, resolveTeamTabFromPathname, teamViewTabs,
  type TeamProfileTab,
} from '../lib/teamTabRouting'

// 02）团队空间核心档案（TeamSpaceCoreProfile）
export interface TeamSpaceCoreProfile {
  teamUid: TeamResourceUid
  name: string
  description: string
  organizationName: string | null
  logoUrl: string | null
  foundedAt: string
  memberCount: number
  type: 'STUDENT_TEAM' | 'LAB'
}

// 03）团队空间扩展档案（TeamSpaceExtendedProfile）
export interface TeamSpaceExtendedProfile {
  notice: string
  contactEmail: string | null
  researchDirection: string | null
  tags: string[]
}

// 04）团队信息行（TeamSpaceInfoRow）
export interface TeamSpaceInfoRow {
  label: string
  value: string
}

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
  renderMainContent: () => ReactNode
}

// 06）团队空间大部件 Hook（useTeamSpaceWidget）
/**
 * 函数名：useTeamSpaceWidget
 * 功能：聚合团队空间页的 Tab 路由、页壳数据加载、侧栏折叠、成员管理模式切换。
 * 实现方法：
 * - useParams + extractTeamUidFromPathname 解析 teamUid
 * - 当前实现以骨架占位，数据加载 TODO 待接入 entities/team/api 中 getTeamProfileSpace
 * - handleManageMembersClick 跳转 /team/:uid/member/manage 进入管理表单（Feature 注入）
 * 输入：无
 * 输出：
 * - 返回值：TeamSpaceWidgetModel
 * - 副作用：路由跳转、滚动重置、网络请求
 */
export function useTeamSpaceWidget(): TeamSpaceWidgetModel {
  const location = useLocation()
  const navigate = useNavigate()
  const { teamUid: teamUidParam } = useParams<{ teamUid: string }>()

  const teamUid = useMemo<TeamResourceUid>(
    () => teamUidParam?.trim() || extractTeamUidFromPathname(location.pathname) || '',
    [location.pathname, teamUidParam],
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

  // 07）路由 segment 校验 / 缺失 teamUid 跳回个人空间
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
    const timeoutId = window.setTimeout(() => setShouldRenderSidebar(false), PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS)
    return () => window.clearTimeout(timeoutId)
  }, [isSidebarCollapsed])

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  // 08）拉取团队空间页壳数据 — TODO：接入 entities/team/api/getTeamProfileSpace + mapTeamProfileSpaceData
  useEffect(() => {
    if (!teamUid) return
    let isCancelled = false
    async function loadShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)
      try {
        // TODO（团队空间 API 集成）：
        // - 调用 entities/team/api/teamProfileApi.getTeamProfileSpace(teamUid)
        // - 通过 entities/team/lib/mapTeamProfileSpaceData(data) 投影到 Widget 视图模型
        await new Promise((resolve) => setTimeout(resolve, 0))
        if (isCancelled) return
        setTeamCoreProfile(null)
        setTeamExtendedProfile(null)
        setTeamMembers([])
        setTeamInfoRows([])
        setShellLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setShellErrorMessage(error instanceof Error ? error.message : '加载团队空间失败，请稍后重试')
        setShellLoadState('error')
      }
    }
    void loadShell()
    return () => { isCancelled = true }
  }, [teamUid])

  const isShellReady =
    shellLoadState === 'ready' && teamCoreProfile != null && teamExtendedProfile != null

  const heroLogoUrl = teamCoreProfile
    ? teamCoreProfile.logoUrl ??
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(teamCoreProfile.name.slice(0, 2))}&backgroundColor=cbd5e1&color=ffffff`
    : ''

  const handleTabClick = (tab: TeamProfileTab): void => {
    if (!teamUid) return
    const targetPath = buildTeamSpacePath(teamUid, tab)
    if (location.pathname !== targetPath) navigate(targetPath)
  }

  const handleManageMembersClick = (): void => {
    if (!teamUid) return
    const targetPath = buildTeamMembersManagePath(teamUid)
    if (location.pathname !== targetPath) navigate(targetPath)
  }

  const handleExitMembersManage = (): void => {
    handleTabClick('成员')
  }

  const renderMainContent = (): ReactNode => {
    // TODO（团队 Tab 内容）：迁移 TeamHomeTab / MembersTab / AchievementsTab / ProjectsTab / NotesTab
    // 至 widgets/profile-space/components/ 后按 activeTab 分发渲染
    return null
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
    renderMainContent,
  }
}
