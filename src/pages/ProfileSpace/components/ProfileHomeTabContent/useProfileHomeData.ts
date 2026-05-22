import { useEffect, useState } from 'react'
import { getUserProfileHome, UserProfileApiError } from '../../../../api/userProfile'
import type { ProjectItem } from '../../../../types/project'
import { mapApiNotes, mapApiProjects } from '../mapProfileTabData'
import type { ProfileTabLoadState } from '../profileTabLoadState'
import type { ProfileNoteItem } from '../types'

// 01）主页 Tab 数据 Hook 返回值（UseProfileHomeDataResult）
export interface UseProfileHomeDataResult {
  loadState: ProfileTabLoadState
  errorMessage: string | null
  projects: ProjectItem[]
  notes: ProfileNoteItem[]
  projectTotal: number | null
  noteTotal: number | null
}

// 02）主页 Tab 数据 Hook（useProfileHomeData）
/**
 * 函数名：useProfileHomeData
 * 功能：在「主页」Tab 激活时拉取 /user-profile/home 预览数据。
 * 实现方法：
 * - 组件挂载时发起请求（由父级按 Tab 条件挂载）
 * - 将 projects、notes 映射为前端展示类型
 * - 捕获 UserProfileApiError 并写入 errorMessage
 * 输入：无
 * 输出：
 * - 返回值：UseProfileHomeDataResult
 * - 副作用：发起网络请求
 */
export function useProfileHomeData(): UseProfileHomeDataResult {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const [projectTotal, setProjectTotal] = useState<number | null>(null)
  const [noteTotal, setNoteTotal] = useState<number | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadHomeTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const homeData = await getUserProfileHome({ projectLimit: 4, noteLimit: 3 })
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
          error instanceof UserProfileApiError
            ? error.message
            : '加载主页内容失败，请稍后重试'
        setErrorMessage(message)
        setLoadState('error')
      }
    }

    void loadHomeTabData()

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    loadState,
    errorMessage,
    projects,
    notes,
    projectTotal,
    noteTotal,
  }
}
