import { useEffect, useState } from 'react'
import { getUserProfileProjects, UserProfileApiError } from '../../../../api/userProfile'
import type { ProjectItem } from '../../../../types/project'
import { mapApiProjects } from '../../components/mapProfileTabData'
import type { ProfileTabLoadState } from '../../components/profileTabLoadState'

// 01）个人项目 Tab 数据 Hook 返回值（UsePersonalProjectsTabDataResult）
export interface UsePersonalProjectsTabDataResult {
  loadState: ProfileTabLoadState
  errorMessage: string | null
  projects: ProjectItem[]
  total: number | null
}

// 02）个人项目 Tab 数据 Hook（usePersonalProjectsTabData）
/**
 * 函数名：usePersonalProjectsTabData
 * 功能：在「项目」Tab 激活时拉取 /user-profile/projects 列表数据。
 * 输出：
 * - 返回值：UsePersonalProjectsTabDataResult
 * - 副作用：发起网络请求
 */
export function usePersonalProjectsTabData(): UsePersonalProjectsTabDataResult {
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
        const projectsData = await getUserProfileProjects({ page: 1, pageSize: 20 })
        if (isCancelled) {
          return
        }

        setProjects(mapApiProjects(projectsData.projects))
        setTotal(projectsData.total ?? null)
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const message =
          error instanceof UserProfileApiError ? error.message : '加载项目列表失败，请稍后重试'
        setErrorMessage(message)
        setLoadState('error')
      }
    }

    void loadProjectsTabData()

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    loadState,
    errorMessage,
    projects,
    total,
  }
}
