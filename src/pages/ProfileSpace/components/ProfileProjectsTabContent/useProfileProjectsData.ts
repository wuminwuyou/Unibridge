import { useEffect, useState } from 'react'
import { getUserProfileProjects, UserProfileApiError } from '../../../../api/userProfile'
import type { ProjectItem } from '../../../../types/project'
import { mapApiProjects } from '../mapProfileTabData'
import type { ProfileTabLoadState } from '../profileTabLoadState'

// 01）项目 Tab 数据 Hook 返回值（UseProfileProjectsDataResult）
export interface UseProfileProjectsDataResult {
  loadState: ProfileTabLoadState
  errorMessage: string | null
  projects: ProjectItem[]
  total: number | null
}

// 02）项目 Tab 数据 Hook（useProfileProjectsData）
/**
 * 函数名：useProfileProjectsData
 * 功能：在「项目」Tab 激活时拉取 /user-profile/projects 列表数据。
 * 实现方法：
 * - 组件挂载时请求第一页（pageSize=20）
 * - 映射 projects 为 ProjectItem
 * 输入：无
 * 输出：
 * - 返回值：UseProfileProjectsDataResult
 * - 副作用：发起网络请求
 */
export function useProfileProjectsData(): UseProfileProjectsDataResult {
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
          error instanceof UserProfileApiError
            ? error.message
            : '加载项目列表失败，请稍后重试'
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
