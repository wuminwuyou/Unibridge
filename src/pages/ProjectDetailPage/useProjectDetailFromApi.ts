import { useEffect, useState } from 'react'
import { getProjectDetail, ProjectsApiError } from '../../api/projects'
import { mapProjectDetailToPayload } from './shared/mapProjectDetailToPayload'
import type { ProjectDetailPayload } from './types'

// 01）项目详情 API 加载状态（ProjectDetailApiLoadState）
export type ProjectDetailApiLoadState = 'idle' | 'loading' | 'error' | 'ready'

// 02）从 API 加载项目详情（useProjectDetailFromApi）
/**
 * 函数名：useProjectDetailFromApi
 * 功能：当路由携带 projectId 时调用 GET /projects/{projectId}。
 */
export function useProjectDetailFromApi(projectId: number | null): {
  loadState: ProjectDetailApiLoadState
  errorMessage: string | null
  payload: ProjectDetailPayload | null
} {
  const [loadState, setLoadState] = useState<ProjectDetailApiLoadState>(projectId ? 'loading' : 'idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [payload, setPayload] = useState<ProjectDetailPayload | null>(null)

  useEffect(() => {
    if (!projectId) {
      setLoadState('idle')
      setErrorMessage(null)
      setPayload(null)
      return
    }

    const activeProjectId = projectId
    let isCancelled = false

    async function loadProjectDetail(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      setPayload(null)

      try {
        const dto = await getProjectDetail(activeProjectId)
        if (isCancelled) {
          return
        }

        setPayload(mapProjectDetailToPayload(dto))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const message =
          error instanceof ProjectsApiError ? error.message : '加载项目详情失败，请稍后重试'
        setErrorMessage(message)
        setLoadState('error')
      }
    }

    void loadProjectDetail()

    return () => {
      isCancelled = true
    }
  }, [projectId])

  return {
    loadState,
    errorMessage,
    payload,
  }
}

// 03）解析项目详情 query id（parseProjectDetailIdFromQuery）
export function parseProjectDetailIdFromQuery(rawId: string | null): number | null {
  if (!rawId) {
    return null
  }

  const projectId = Number.parseInt(rawId, 10)
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return null
  }

  return projectId
}
