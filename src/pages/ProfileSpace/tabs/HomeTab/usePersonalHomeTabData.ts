import { useEffect, useState } from 'react'
import { getUserProfileHome, UserProfileApiError } from '../../../../api/userProfile'
import type { UserResourceUid } from '../../../../api/resourceUid'
import type { ProjectItem } from '../../../../types/project'
import { mapApiNotes, mapApiProjects } from '../../components/mapProfileTabData'
import type { ProfileTabLoadState } from '../../components/profileTabLoadState'
import type { ProfileNoteItem } from '../../components/types'
import {
  PROFILE_SPACE_PERSONAL_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_PERSONAL_HOME_PROJECT_PREVIEW_LIMIT,
} from '../../profileSpaceTabConstants'

// 01）个人主页 Tab 数据 Hook 参数（UsePersonalHomeTabDataOptions）
interface UsePersonalHomeTabDataOptions {
  profileUid: UserResourceUid
  enabled: boolean
}

// 02）个人主页 Tab 数据 Hook 返回值（UsePersonalHomeTabDataResult）
export interface UsePersonalHomeTabDataResult {
  loadState: ProfileTabLoadState
  errorMessage: string | null
  projects: ProjectItem[]
  notes: ProfileNoteItem[]
  projectTotal: number | null
  noteTotal: number | null
}

// 03）个人主页 Tab 数据 Hook（usePersonalHomeTabData）
/**
 * 函数名：usePersonalHomeTabData
 * 功能：在页壳就绪且「主页」Tab 激活时拉取 /user-profile/home 预览数据。
 * 输入：
 * - options.profileUid：与 space 页壳一致的用户 uid
 * - options.enabled：是否允许发起请求
 * 输出：
 * - 返回值：UsePersonalHomeTabDataResult
 * - 副作用：发起网络请求
 */
export function usePersonalHomeTabData(options: UsePersonalHomeTabDataOptions): UsePersonalHomeTabDataResult {
  const { profileUid, enabled } = options
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const [projectTotal, setProjectTotal] = useState<number | null>(null)
  const [noteTotal, setNoteTotal] = useState<number | null>(null)

  useEffect(() => {
    if (!enabled || !profileUid) {
      return
    }

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
        if (isCancelled) {
          return
        }

        setProjects(mapApiProjects(homeData.projects))
        setNotes(mapApiNotes(homeData.notes))
        setProjectTotal(homeData.projectTotal ?? null)
        setNoteTotal(homeData.noteTotal ?? null)
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const message =
          error instanceof UserProfileApiError ? error.message : '加载主页内容失败，请稍后重试'
        setErrorMessage(message)
        setLoadState('error')
      }
    }

    void loadHomeTabData()

    return () => {
      isCancelled = true
    }
  }, [enabled, profileUid])

  return {
    loadState,
    errorMessage,
    projects,
    notes,
    projectTotal,
    noteTotal,
  }
}
