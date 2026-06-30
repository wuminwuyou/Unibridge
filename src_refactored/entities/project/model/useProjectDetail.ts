// 01）项目详情 API 加载 Hook（useProjectDetail）
import { useEffect, useState } from 'react'
import type { ProjectResourceUid } from '@shared/api/resourceUid'
import { getProjectDetail, ProjectsApiError } from '../api/projectApi'
import { mapProjectDetailToPayload } from '../lib/mapProjectDetailToPayload'
import type { ProjectDetailPayload, ProjectDetailApiLoadState } from '../model/projectDetailViewModel'

// 02）fromApi Hook
/**
 * 函数名：useProjectDetail
 * 功能：当提供 project uid 时调用 GET /projects/{uid}，自动映射为 ViewModel。
 * 职责边界：仅 fetch + map；不含 route state / sessionStorage / editorial 判定（留给 widget hook）。
 * 输入：
 * - projectUid：项目 uid（null 时不请求，重置为 idle）
 * 输出：
 * - loadState：idle | loading | error | ready
 * - errorMessage：错误时显示文本
 * - payload：已映射的 ProjectDetailPayload
 */
export function useProjectDetail(projectUid: ProjectResourceUid | null): {
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
