import { useCallback, useEffect, useState } from 'react'
import {
  getTeamProfileAchievements,
  getTeamProfileHome,
  getTeamProfileMembers,
  getTeamProfileNotes,
  getTeamProfileProjects,
  TeamProfileApiError,
} from '../../../../api/teamProfile'
import { mapApiNotes, mapApiProjects } from '../../components/mapProfileTabData'
import type { ProfileTabLoadState } from '../../components/profileTabLoadState'
import {
  PROFILE_SPACE_TEAM_HOME_ACHIEVEMENT_PREVIEW_LIMIT,
  PROFILE_SPACE_TEAM_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_TEAM_HOME_PROJECT_PREVIEW_LIMIT,
} from '../../profileSpaceTabConstants'
import { mapTeamProfileAchievements } from './mapTeamProfileAchievements'
import { mapTeamProfileMembers } from './mapTeamProfileSpaceData'
import type { TeamAchievementItem, TeamMemberItem } from './types'
import type { ProjectItem } from '../../../../types/project'
import type { ProfileNoteItem } from '../../components/types'
import type { TeamResourceUid } from '../../../../api/resourceUid'

// 01）解析 Tab 加载错误文案（resolveTeamTabErrorMessage）
function resolveTeamTabErrorMessage(error: unknown, fallback: string): string {
  return error instanceof TeamProfileApiError ? error.message : fallback
}

// 02）团队主页 Tab 数据 Hook（useTeamHomeTabData）
/**
 * 函数名：useTeamHomeTabData
 * 功能：在「主页」Tab 激活时拉取团队项目/笔记/成果预览。
 * 输入：
 * - teamUid：团队 uid
 * - enabled：是否发起请求
 * 输出：
 * - 返回值：主页 Tab 数据与加载态
 * - 副作用：发起网络请求
 */
export function useTeamHomeTabData(teamUid: TeamResourceUid, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const [achievements, setAchievements] = useState<TeamAchievementItem[]>([])

  useEffect(() => {
    if (!enabled || !teamUid) {
      return
    }

    let isCancelled = false

    async function loadHomeTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const homeData = await getTeamProfileHome(teamUid, {
          projectLimit: PROFILE_SPACE_TEAM_HOME_PROJECT_PREVIEW_LIMIT,
          noteLimit: PROFILE_SPACE_TEAM_HOME_NOTE_PREVIEW_LIMIT,
          achievementLimit: PROFILE_SPACE_TEAM_HOME_ACHIEVEMENT_PREVIEW_LIMIT,
        })
        if (isCancelled) {
          return
        }

        setProjects(mapApiProjects(homeData.projects))
        setNotes(mapApiNotes(homeData.notes))
        setAchievements(mapTeamProfileAchievements(homeData.achievements))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        setErrorMessage(resolveTeamTabErrorMessage(error, '加载团队主页内容失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadHomeTabData()

    return () => {
      isCancelled = true
    }
  }, [enabled, teamUid])

  return { loadState, errorMessage, projects, notes, achievements }
}

// 03）团队成员 Tab 数据 Hook（useTeamMembersTabData）
/**
 * 函数名：useTeamMembersTabData
 * 功能：在「成员」Tab 激活时拉取完整成员列表。
 * 输入：
 * - teamUid：团队 uid
 * - enabled：是否发起请求
 * 输出：
 * - 返回值：成员 Tab 数据与加载态
 * - 副作用：发起网络请求
 */
export function useTeamMembersTabData(teamUid: TeamResourceUid, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [members, setMembers] = useState<TeamMemberItem[]>([])
  const [reloadToken, setReloadToken] = useState(0)

  const reloadMembers = useCallback((): void => {
    setReloadToken((currentToken) => currentToken + 1)
  }, [])

  useEffect(() => {
    if (!enabled || !teamUid) {
      return
    }

    let isCancelled = false

    async function loadMembersTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const membersData = await getTeamProfileMembers(teamUid)
        if (isCancelled) {
          return
        }

        setMembers(mapTeamProfileMembers(membersData.members))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        setErrorMessage(resolveTeamTabErrorMessage(error, '加载团队成员失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadMembersTabData()

    return () => {
      isCancelled = true
    }
  }, [enabled, teamUid, reloadToken])

  return { loadState, errorMessage, members, reloadMembers }
}

// 04）团队项目 Tab 数据 Hook（useTeamProjectsTabData）
export function useTeamProjectsTabData(teamUid: TeamResourceUid, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])

  useEffect(() => {
    if (!enabled || !teamUid) {
      return
    }

    let isCancelled = false

    async function loadProjectsTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const projectsData = await getTeamProfileProjects(teamUid)
        if (isCancelled) {
          return
        }

        setProjects(mapApiProjects(projectsData.projects))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        setErrorMessage(resolveTeamTabErrorMessage(error, '加载团队项目失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadProjectsTabData()

    return () => {
      isCancelled = true
    }
  }, [enabled, teamUid])

  return { loadState, errorMessage, projects }
}

// 05）团队笔记 Tab 数据 Hook（useTeamNotesTabData）
export function useTeamNotesTabData(teamUid: TeamResourceUid, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])

  useEffect(() => {
    if (!enabled || !teamUid) {
      return
    }

    let isCancelled = false

    async function loadNotesTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const notesData = await getTeamProfileNotes(teamUid)
        if (isCancelled) {
          return
        }

        setNotes(mapApiNotes(notesData.notes))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        setErrorMessage(resolveTeamTabErrorMessage(error, '加载团队笔记失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadNotesTabData()

    return () => {
      isCancelled = true
    }
  }, [enabled, teamUid])

  return { loadState, errorMessage, notes }
}

// 06）团队成果 Tab 数据 Hook（useTeamAchievementsTabData）
export function useTeamAchievementsTabData(teamUid: TeamResourceUid, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<TeamAchievementItem[]>([])

  useEffect(() => {
    if (!enabled || !teamUid) {
      return
    }

    let isCancelled = false

    async function loadAchievementsTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const achievementsData = await getTeamProfileAchievements(teamUid)
        if (isCancelled) {
          return
        }

        setAchievements(mapTeamProfileAchievements(achievementsData.achievements))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        setErrorMessage(resolveTeamTabErrorMessage(error, '加载团队成果失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadAchievementsTabData()

    return () => {
      isCancelled = true
    }
  }, [enabled, teamUid])

  return { loadState, errorMessage, achievements }
}
