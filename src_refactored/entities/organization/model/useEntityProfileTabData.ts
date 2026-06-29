// 01）机构空间 Tab 数据 Hooks（useEntityProfileTabData）
import { useCallback, useEffect, useState } from 'react'
import type { EntityCode } from '@shared/api/resourceUid'
import type { ProjectItem } from '@shared/types/project'
import type { ProfileTabLoadState } from '@shared/types/loadState'
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import { mapApiNotes } from '@entities/note/lib/mapNoteListData'
import { mapApiProjects } from '@entities/project/lib/mapProjectListData'
import type { ProfileOrgMemberItem } from '@entities/member/model'
import {
  EntityProfileApiError, getEntityProfileHome, getEntityProfileMembers,
  getEntityProfileNotes, getEntityProfileProjects, getEntityProfileTeams,
} from '@entities/organization/api/entityProfileApi'
import {
  mapEntityProfileMembers, mapEntityProfileTeams,
  type OrganizationProfileTeamItemVm,
} from '@entities/organization/lib/mapEntityProfileSpaceData'

// 02）解析 Tab 加载错误文案（resolveOrganizationTabErrorMessage）
function resolveOrganizationTabErrorMessage(error: unknown, fallback: string): string {
  return error instanceof EntityProfileApiError ? error.message : fallback
}

// 03）机构主页 Tab Hook 入参
interface UseEntityProfileHomeTabDataOptions {
  entityCode: EntityCode
  enabled: boolean
  supportsLabs: boolean
  teamLimit?: number
  memberLimit?: number
  projectLimit?: number
  noteLimit?: number
}

// 04）机构主页 Tab 数据 Hook（useEntityProfileHomeTabData）
/**
 * 函数名：useEntityProfileHomeTabData
 * 功能：在「主页」Tab 激活时拉取机构项目/笔记/实验室/人员预览。
 * 实现方法：
 * - 通过 options 控制各区块预览条数
 * - 仅在 supportsLabs 时请求实验室预览
 * 输入：
 * - options.entityCode / enabled / supportsLabs / *Limit
 * 输出：
 * - 返回值：主页 Tab 数据与加载态
 * - 副作用：发起网络请求
 */
export function useEntityProfileHomeTabData(options: UseEntityProfileHomeTabDataOptions) {
  const {
    entityCode, enabled, supportsLabs,
    teamLimit, memberLimit, projectLimit, noteLimit,
  } = options
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const [teams, setTeams] = useState<OrganizationProfileTeamItemVm[]>([])
  const [members, setMembers] = useState<ProfileOrgMemberItem[]>([])

  useEffect(() => {
    if (!enabled || !entityCode) return
    let isCancelled = false

    async function loadHomeTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const homeData = await getEntityProfileHome(entityCode, {
          teamLimit: supportsLabs ? teamLimit : undefined,
          memberLimit,
          projectLimit,
          noteLimit,
        })
        if (isCancelled) return
        setProjects(mapApiProjects(homeData.projects))
        setNotes(mapApiNotes(homeData.notes))
        setTeams(supportsLabs ? mapEntityProfileTeams(homeData.teams) : [])
        setMembers(mapEntityProfileMembers(homeData.members))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(resolveOrganizationTabErrorMessage(error, '加载机构主页内容失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadHomeTabData()
    return () => { isCancelled = true }
  }, [enabled, entityCode, supportsLabs, teamLimit, memberLimit, projectLimit, noteLimit])

  return { loadState, errorMessage, projects, notes, teams, members }
}

// 05）机构实验室 Tab 数据 Hook（useEntityProfileLabsTabData）
export function useEntityProfileLabsTabData(entityCode: EntityCode, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [teams, setTeams] = useState<OrganizationProfileTeamItemVm[]>([])
  const [reloadCounter, setReloadCounter] = useState(0)

  const reloadLabs = useCallback((): void => {
    setReloadCounter((c) => c + 1)
  }, [])

  useEffect(() => {
    if (!enabled || !entityCode) return
    let isCancelled = false

    async function loadLabsTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const teamsData = await getEntityProfileTeams(entityCode)
        if (isCancelled) return
        setTeams(mapEntityProfileTeams(teamsData.teams))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(resolveOrganizationTabErrorMessage(error, '加载实验室列表失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadLabsTabData()
    return () => { isCancelled = true }
  }, [enabled, entityCode, reloadCounter])

  return { loadState, errorMessage, teams, reloadLabs }
}

// 06）机构项目 Tab 数据 Hook（useEntityProfileProjectsTabData）
export function useEntityProfileProjectsTabData(entityCode: EntityCode, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])

  useEffect(() => {
    if (!enabled || !entityCode) return
    let isCancelled = false

    async function loadProjectsTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const projectsData = await getEntityProfileProjects(entityCode)
        if (isCancelled) return
        setProjects(mapApiProjects(projectsData.projects))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(resolveOrganizationTabErrorMessage(error, '加载机构项目失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadProjectsTabData()
    return () => { isCancelled = true }
  }, [enabled, entityCode])

  return { loadState, errorMessage, projects }
}

// 07）机构笔记 Tab 数据 Hook（useEntityProfileNotesTabData）
export function useEntityProfileNotesTabData(entityCode: EntityCode, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])

  useEffect(() => {
    if (!enabled || !entityCode) return
    let isCancelled = false

    async function loadNotesTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const notesData = await getEntityProfileNotes(entityCode)
        if (isCancelled) return
        setNotes(mapApiNotes(notesData.notes))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(resolveOrganizationTabErrorMessage(error, '加载机构笔记失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadNotesTabData()
    return () => { isCancelled = true }
  }, [enabled, entityCode])

  return { loadState, errorMessage, notes }
}

// 08）机构人员 Tab 数据 Hook（useEntityProfileMembersTabData）
export function useEntityProfileMembersTabData(entityCode: EntityCode, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [members, setMembers] = useState<ProfileOrgMemberItem[]>([])
  const [reloadCounter, setReloadCounter] = useState(0)

  const reloadMembers = useCallback((): void => {
    setReloadCounter((c) => c + 1)
  }, [])

  useEffect(() => {
    if (!enabled || !entityCode) return
    let isCancelled = false

    async function loadMembersTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const membersData = await getEntityProfileMembers(entityCode)
        if (isCancelled) return
        setMembers(mapEntityProfileMembers(membersData.members))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(resolveOrganizationTabErrorMessage(error, '加载机构人员失败，请稍后重试'))
        setLoadState('error')
      }
    }

    void loadMembersTabData()
    return () => { isCancelled = true }
  }, [enabled, entityCode, reloadCounter])

  return { loadState, errorMessage, members, reloadMembers }
}
