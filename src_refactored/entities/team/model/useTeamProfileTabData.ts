// 01）团队空间 Tab 数据 Hooks（useTeamProfileTabData）
import { useCallback, useEffect, useState } from 'react'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import type { ProjectItem } from '@shared/types/project'
import type { ProfileTabLoadState } from '@shared/types/loadState'
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import { mapApiNotes } from '@entities/note/lib/mapNoteListData'
import { mapApiProjects } from '@entities/project/lib/mapProjectListData'
import type { ProfileMemberItem } from '@entities/member/model'
import type { ProfileAchievementItem } from '@entities/team/ui/AchievementCard'
import {
  getTeamProfileAchievements, getTeamProfileHome, getTeamProfileMembers,
  getTeamProfileNotes, getTeamProfileProjects, TeamProfileApiError,
} from '@entities/team/api/teamProfileApi'
import { mapTeamProfileAchievements } from '@entities/team/lib/mapTeamProfileAchievements'
import { mapTeamProfileMembers } from '@entities/team/lib/mapTeamProfileSpaceData'

// 02）解析 Tab 加载错误文案（resolveTeamTabErrorMessage）
function resolveTeamTabErrorMessage(error: unknown, fallback: string): string {
  return error instanceof TeamProfileApiError ? error.message : fallback
}

// 03）团队主页 Tab Hook 入参
interface UseTeamProfileHomeTabDataOptions {
  teamUid: TeamResourceUid
  enabled: boolean
  projectLimit?: number
  noteLimit?: number
  achievementLimit?: number
}

// 04）团队主页 Tab 数据 Hook（useTeamProfileHomeTabData）
/**
 * 函数名：useTeamProfileHomeTabData
 * 功能：在「主页」Tab 激活时拉取团队项目/笔记/成果预览。
 * 输入：
 * - options.teamUid：团队 uid
 * - options.enabled：是否发起请求
 * - options.projectLimit / noteLimit / achievementLimit：预览条数
 * 输出：
 * - 返回值：主页 Tab 数据与加载态
 * - 副作用：发起网络请求
 */
export function useTeamProfileHomeTabData(options: UseTeamProfileHomeTabDataOptions) {
  const { teamUid, enabled, projectLimit, noteLimit, achievementLimit } = options
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const [achievements, setAchievements] = useState<ProfileAchievementItem[]>([])

  useEffect(() => {
    if (!enabled || !teamUid) return
    let isCancelled = false

    async function loadHomeTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const homeData = await getTeamProfileHome(teamUid, {
          projectLimit,
          noteLimit,
          achievementLimit,
        })
        if (isCancelled) return
        setProjects(mapApiProjects(homeData.projects))
        setNotes(mapApiNotes(homeData.notes))
        setAchievements(mapTeamProfileAchievements(homeData.achievements))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(resolveTeamTabErrorMessage(error, '加载团队主页内容失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadHomeTabData()
    return () => { isCancelled = true }
  }, [enabled, teamUid, projectLimit, noteLimit, achievementLimit])

  return { loadState, errorMessage, projects, notes, achievements }
}

// 05）团队成员 Tab 数据 Hook（useTeamProfileMembersTabData）
export function useTeamProfileMembersTabData(teamUid: TeamResourceUid, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [members, setMembers] = useState<ProfileMemberItem[]>([])
  const [reloadToken, setReloadToken] = useState(0)

  const reloadMembers = useCallback((): void => {
    setReloadToken((currentToken) => currentToken + 1)
  }, [])

  useEffect(() => {
    if (!enabled || !teamUid) return
    let isCancelled = false

    async function loadMembersTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const membersData = await getTeamProfileMembers(teamUid)
        if (isCancelled) return
        setMembers(mapTeamProfileMembers(membersData.members))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(resolveTeamTabErrorMessage(error, '加载团队成员失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadMembersTabData()
    return () => { isCancelled = true }
  }, [enabled, teamUid, reloadToken])

  return { loadState, errorMessage, members, reloadMembers }
}

// 06）团队项目 Tab 数据 Hook（useTeamProfileProjectsTabData）
export function useTeamProfileProjectsTabData(teamUid: TeamResourceUid, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])

  useEffect(() => {
    if (!enabled || !teamUid) return
    let isCancelled = false

    async function loadProjectsTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const projectsData = await getTeamProfileProjects(teamUid)
        if (isCancelled) return
        setProjects(mapApiProjects(projectsData.projects))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(resolveTeamTabErrorMessage(error, '加载团队项目失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadProjectsTabData()
    return () => { isCancelled = true }
  }, [enabled, teamUid])

  return { loadState, errorMessage, projects }
}

// 07）团队笔记 Tab 数据 Hook（useTeamProfileNotesTabData）
export function useTeamProfileNotesTabData(teamUid: TeamResourceUid, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])

  useEffect(() => {
    if (!enabled || !teamUid) return
    let isCancelled = false

    async function loadNotesTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const notesData = await getTeamProfileNotes(teamUid)
        if (isCancelled) return
        setNotes(mapApiNotes(notesData.notes))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(resolveTeamTabErrorMessage(error, '加载团队笔记失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadNotesTabData()
    return () => { isCancelled = true }
  }, [enabled, teamUid])

  return { loadState, errorMessage, notes }
}

// 08）团队成果 Tab 数据 Hook（useTeamProfileAchievementsTabData）
export function useTeamProfileAchievementsTabData(teamUid: TeamResourceUid, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<ProfileAchievementItem[]>([])

  useEffect(() => {
    if (!enabled || !teamUid) return
    let isCancelled = false

    async function loadAchievementsTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const achievementsData = await getTeamProfileAchievements(teamUid)
        if (isCancelled) return
        setAchievements(mapTeamProfileAchievements(achievementsData.achievements))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(resolveTeamTabErrorMessage(error, '加载团队成果失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadAchievementsTabData()
    return () => { isCancelled = true }
  }, [enabled, teamUid])

  return { loadState, errorMessage, achievements }
}
