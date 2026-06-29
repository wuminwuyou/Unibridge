// 01）个人空间 Tab 数据 Hooks（usePersonalTabData）
import { useEffect, useState } from 'react'
import type { UserResourceUid } from '@shared/api/resourceUid'
import type { ProjectItem } from '@shared/types/project'
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import {
  getUserProfileHome, getUserProfileNotes, getUserProfileProjects, UserProfileApiError,
} from '@entities/user/api/userProfileApi'
import { mapApiNotes, mapApiProjects } from '../lib/mapProfileTabData'
import type { ProfileTabLoadState } from '../lib/profileTabLoadState'
import {
  PROFILE_SPACE_PERSONAL_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_PERSONAL_HOME_PROJECT_PREVIEW_LIMIT,
} from '../lib/profileSpaceTabConstants'

// 02）个人主页 Tab 数据 Hook（usePersonalHomeTabData）
/**
 * 函数名：usePersonalHomeTabData
 * 功能：在页壳就绪且「主页」Tab 激活时拉取 /user-profile/home 预览数据。
 * 输入：
 * - options.profileUid：与 space 页壳一致的用户 uid
 * - options.enabled：是否允许发起请求
 * 输出：
 * - 返回值：主页 Tab 数据与加载态
 * - 副作用：发起网络请求
 */
export function usePersonalHomeTabData(options: { profileUid: UserResourceUid; enabled: boolean }) {
  const { profileUid, enabled } = options
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
          projectLimit: PROFILE_SPACE_PERSONAL_HOME_PROJECT_PREVIEW_LIMIT,
          noteLimit: PROFILE_SPACE_PERSONAL_HOME_NOTE_PREVIEW_LIMIT,
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
  }, [enabled, profileUid])

  return { loadState, errorMessage, projects, notes, projectTotal, noteTotal }
}

// 03）个人项目 Tab 数据 Hook（usePersonalProjectsTabData）
/**
 * 函数名：usePersonalProjectsTabData
 * 功能：在「项目」Tab 激活时拉取 /user-profile/projects 列表数据。
 * 输入：
 * - profileUid：目标用户 uid（查看他人空间时由 ?uid= 传入）
 * 输出：
 * - 返回值：项目 Tab 数据与加载态
 * - 副作用：发起网络请求
 */
export function usePersonalProjectsTabData(profileUid?: UserResourceUid | null) {
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

// 04）个人笔记 Tab 数据 Hook（usePersonalNotesTabData）
/**
 * 函数名：usePersonalNotesTabData
 * 功能：在「笔记」Tab 激活时拉取 /user-profile/notes 列表数据。
 * 输入：
 * - profileUid：目标用户 uid（查看他人空间时由 ?uid= 传入）
 * 输出：
 * - 返回值：笔记 Tab 数据与加载态
 * - 副作用：发起网络请求
 */
export function usePersonalNotesTabData(profileUid?: UserResourceUid | null) {
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
