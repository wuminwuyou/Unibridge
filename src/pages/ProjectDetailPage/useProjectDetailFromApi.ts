import { useEffect, useState } from 'react'
import { getProjectDetail, ProjectsApiError } from '../../api/projects'
import type { ProjectResourceUid } from '../../api/resourceUid'
import { parseProjectUidFromQuery } from '../../api/resourceUid'
import { mapProjectDetailToPayload } from './shared/mapProjectDetailToPayload'
import type { ProjectDetailPayload } from './types'

// 01）项目详情 API 加载状态（ProjectDetailApiLoadState）
export type ProjectDetailApiLoadState = 'idle' | 'loading' | 'error' | 'ready'

// 02）从 API 加载项目详情（useProjectDetailFromApi）
/**
 * 函数名：useProjectDetailFromApi
 * 功能：当路由携带 project uid 时调用 GET /projects/{uid}。
 */
export function useProjectDetailFromApi(projectUid: ProjectResourceUid | null): {
  loadState: ProjectDetailApiLoadState
  errorMessage: string | null
  payload: ProjectDetailPayload | null
} {
  const [loadState, setLoadState] = useState<ProjectDetailApiLoadState>(projectUid ? 'loading' : 'idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [payload, setPayload] = useState<ProjectDetailPayload | null>(null)

  useEffect(() => {
    if (!projectUid) {
      setLoadState('idle')
      setErrorMessage(null)
      setPayload(null)
      return
    }

    const activeProjectUid = projectUid
    let isCancelled = false

    async function loadProjectDetail(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      setPayload(null)

      try {
        const dto = await getProjectDetail(activeProjectUid)
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
  }, [projectUid])

  return {
    loadState,
    errorMessage,
    payload,
  }
}

// 03）解析项目详情 query uid（parseProjectDetailUidFromQuery）
export function parseProjectDetailUidFromQuery(
  uidParam: string | null,
  legacyIdParam: string | null = null,
): ProjectResourceUid | null {
  return parseProjectUidFromQuery(uidParam, legacyIdParam)
}

/** @deprecated 使用 parseProjectDetailUidFromQuery */
export function parseProjectDetailIdFromQuery(rawId: string | null): ProjectResourceUid | null {
  return parseProjectDetailUidFromQuery(null, rawId)
}
