// 01）个人空间 Tab 数据 Hooks（useUserProfileTabData）
import { useEffect, useState } from 'react'
import type { UserResourceUid } from '@shared/api/resourceUid'
import type { ProjectItem } from '@shared/types/project'
import type { ProfileTabLoadState } from '@shared/types/loadState'
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import { mapApiNotes } from '@entities/note/lib/mapNoteListData'
import { mapApiProjects } from '@entities/project/lib/mapProjectListData'
import {
  getUserProfileHome, getUserProfileNotes, getUserProfileProjects, UserProfileApiError,
} from '@entities/user/api/userProfileApi'

// 02）个人主页 Tab 数据 Hook 入参与返回
interface UseUserProfileHomeTabDataOptions {
  profileUid: UserResourceUid
  enabled: boolean
  projectLimit?: number
  noteLimit?: number
}

export interface UserProfileHomeTabDataResult {
  loadState: ProfileTabLoadState
  errorMessage: string | null
  projects: ProjectItem[]
  notes: ProfileNoteItem[]
  projectTotal: number | null
  noteTotal: number | null
}

// 03）个人主页 Tab 数据 Hook（useUserProfileHomeTabData）
/**
 * 函数名：useUserProfileHomeTabData
 * 功能：在「主页」Tab 激活时拉取 /user-profile/home 项目/笔记预览。
 * 实现方法：
 * - 通过 profileUid + enabled 触发数据加载
 * - 调用 entities/user/api/userProfileApi
 * - 通过 mapApiProjects / mapApiNotes 转换为 UI 视图模型
 * 输入：
 * - options.profileUid：目标用户 uid
 * - options.enabled：是否允许发起请求
 * - options.projectLimit / options.noteLimit：预览条数上限
 * 输出：
 * - 返回值：主页 Tab 数据与加载态
 * - 副作用：发起网络请求
 */
export function useUserProfileHomeTabData(
  options: UseUserProfileHomeTabDataOptions,
): UserProfileHomeTabDataResult {
  const { profileUid, enabled, projectLimit, noteLimit } = options
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const [projectTotal, setProjectTotal] = useState<number | null>(null)
  const [noteTotal, setNoteTotal] = useState<number | null>(null)

  useEffect(() => {
    if (!enabled || !profileUid) return
    let isCancelled = false

    async function loadHomeTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const homeData = await getUserProfileHome({
          profileUid,
          projectLimit,
          noteLimit,
        })
        if (isCancelled) return
        setProjects(mapApiProjects(homeData.projects))
        setNotes(mapApiNotes(homeData.notes))
        setProjectTotal(homeData.projectTotal ?? null)
        setNoteTotal(homeData.noteTotal ?? null)
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(error instanceof UserProfileApiError ? error.message : '加载主页内容失败，请稍后重试')
        setLoadState('error')
      }
    }

    void loadHomeTabData()
    return () => { isCancelled = true }
  }, [enabled, profileUid, projectLimit, noteLimit])

  return { loadState, errorMessage, projects, notes, projectTotal, noteTotal }
}

// 04）个人项目 Tab 数据 Hook（useUserProfileProjectsTabData）
/**
 * 函数名：useUserProfileProjectsTabData
 * 功能：在「项目」Tab 激活时拉取 /user-profile/projects 列表数据。
 * 输入：
 * - profileUid：目标用户 uid（查看他人空间时由 ?uid= 传入）
 * 输出：
 * - 返回值：{ loadState, errorMessage, projects, total }
 * - 副作用：发起网络请求
 */
export function useUserProfileProjectsTabData(profileUid?: UserResourceUid | null) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadProjectsTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const projectsData = await getUserProfileProjects({
          page: 1,
          pageSize: 20,
          profileUid: profileUid ?? undefined,
        })
        if (isCancelled) return
        setProjects(mapApiProjects(projectsData.projects))
        setTotal(projectsData.total ?? null)
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(error instanceof UserProfileApiError ? error.message : '加载项目列表失败，请稍后重试')
        setLoadState('error')
      }
    }

    void loadProjectsTabData()
    return () => { isCancelled = true }
  }, [profileUid])

  return { loadState, errorMessage, projects, total }
}

// 05）个人笔记 Tab 数据 Hook（useUserProfileNotesTabData）
/**
 * 函数名：useUserProfileNotesTabData
 * 功能：在「笔记」Tab 激活时拉取 /user-profile/notes 列表数据。
 * 输入：
 * - profileUid：目标用户 uid（查看他人空间时由 ?uid= 传入）
 * 输出：
 * - 返回值：{ loadState, errorMessage, notes, total }
 * - 副作用：发起网络请求
 */
export function useUserProfileNotesTabData(profileUid?: UserResourceUid | null) {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadNotesTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const notesData = await getUserProfileNotes({
          page: 1,
          pageSize: 20,
          profileUid: profileUid ?? undefined,
        })
        if (isCancelled) return
        setNotes(mapApiNotes(notesData.notes))
        setTotal(notesData.total ?? null)
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) return
        setErrorMessage(error instanceof UserProfileApiError ? error.message : '加载笔记列表失败，请稍后重试')
        setLoadState('error')
      }
    }

    void loadNotesTabData()
    return () => { isCancelled = true }
  }, [profileUid])

  return { loadState, errorMessage, notes, total }
}
