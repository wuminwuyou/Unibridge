// 01）机构空间 Tab 数据 Hooks（useOrganizationTabData）
import { useEffect, useState } from 'react'
import type { EntityCode } from '@shared/api/resourceUid'
import type { ProjectItem } from '@shared/types/project'
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import type { ProfileOrgMemberItem } from '@entities/member/model'
import {
  EntityProfileApiError, getEntityProfileHome, getEntityProfileMembers,
  getEntityProfileNotes, getEntityProfileProjects, getEntityProfileTeams,
} from '@entities/organization/api/entityProfileApi'
import {
  mapEntityProfileMembers, mapEntityProfileTeams,
  type OrganizationProfileTeamItemVm,
} from '@entities/organization/lib/mapEntityProfileSpaceData'
import { mapApiNotes, mapApiProjects } from '../lib/mapProfileTabData'
import type { ProfileTabLoadState } from '../lib/profileTabLoadState'
import {
  PROFILE_SPACE_ORG_HOME_MEMBER_PREVIEW_LIMIT,
  PROFILE_SPACE_ORG_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_ORG_HOME_PROJECT_PREVIEW_LIMIT,
  PROFILE_SPACE_ORG_HOME_TEAM_PREVIEW_LIMIT,
} from '../lib/profileSpaceTabConstants'

// 02）解析 Tab 加载错误文案（resolveOrganizationTabErrorMessage）
function resolveOrganizationTabErrorMessage(error: unknown, fallback: string): string {
  return error instanceof EntityProfileApiError ? error.message : fallback
}

// 03）机构主页 Tab 数据 Hook（useOrganizationHomeTabData）
/**
 * 函数名：useOrganizationHomeTabData
 * 功能：在「主页」Tab 激活时拉取机构项目/笔记/实验室/人员预览。
 * 输入：
 * - entityCode：机构主体代码
 * - enabled：是否发起请求
 * - supportsLabs：是否请求实验室预览
 * 输出：
 * - 返回值：主页 Tab 数据与加载态
 * - 副作用：发起网络请求
 */
export function useOrganizationHomeTabData(
  entityCode: EntityCode,
  enabled: boolean,
  supportsLabs: boolean,
) {
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
          teamLimit: supportsLabs ? PROFILE_SPACE_ORG_HOME_TEAM_PREVIEW_LIMIT : undefined,
          memberLimit: PROFILE_SPACE_ORG_HOME_MEMBER_PREVIEW_LIMIT,
          projectLimit: PROFILE_SPACE_ORG_HOME_PROJECT_PREVIEW_LIMIT,
          noteLimit: PROFILE_SPACE_ORG_HOME_NOTE_PREVIEW_LIMIT,
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
  }, [enabled, entityCode, supportsLabs])

  return { loadState, errorMessage, projects, notes, teams, members }
}

// 04）机构实验室 Tab 数据 Hook（useOrganizationLabsTabData）
export function useOrganizationLabsTabData(entityCode: EntityCode, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [teams, setTeams] = useState<OrganizationProfileTeamItemVm[]>([])
  const [reloadCounter, setReloadCounter] = useState(0)

  const reloadLabs = (): void => {
    setReloadCounter((c) => c + 1)
  }

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

// 05）机构项目 Tab 数据 Hook（useOrganizationProjectsTabData）
export function useOrganizationProjectsTabData(entityCode: EntityCode, enabled: boolean) {
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

// 06）机构笔记 Tab 数据 Hook（useOrganizationNotesTabData）
export function useOrganizationNotesTabData(entityCode: EntityCode, enabled: boolean) {
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

// 07）机构人员 Tab 数据 Hook（useOrganizationMembersTabData）
/**
 * 函数名：useOrganizationMembersTabData
 * 功能：在「人员」Tab 激活时拉取机构关联人员完整列表。
 * 输入：
 * - entityCode：机构主体代码
 * - enabled：是否发起请求
 * 输出：
 * - 返回值：人员 Tab 数据与加载态（含 reloadMembers）
 * - 副作用：发起网络请求
 */
export function useOrganizationMembersTabData(entityCode: EntityCode, enabled: boolean) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [members, setMembers] = useState<ProfileOrgMemberItem[]>([])
  const [reloadCounter, setReloadCounter] = useState(0)

  const reloadMembers = (): void => {
    setReloadCounter((c) => c + 1)
  }

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
