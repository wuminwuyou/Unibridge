import { useEffect, useState } from 'react'
import type { ProjectItem } from '../../types/project'
import { FeedApiError, getProjectFeed, mapFeedProjects } from './index'
import type { FeedLoadState, FeedProjectCategory } from './types'

// 01）项目 Feed Hook 参数（UseProjectFeedDataParams）
export interface UseProjectFeedDataParams {
  category: FeedProjectCategory
  limit?: number
}

// 02）项目 Feed Hook 返回值（UseProjectFeedDataResult）
export interface UseProjectFeedDataResult {
  loadState: FeedLoadState
  errorMessage: string | null
  projects: ProjectItem[]
}

// 03）项目专区 Feed 数据 Hook（useProjectFeedData）
/**
 * 函数名：useProjectFeedData
 * 功能：按 category 拉取 GET /feed/projects 并映射为 ProjectItem 列表。
 * 实现方法：
 * - category 变化时重新请求
 * - 捕获 FeedApiError 写入 errorMessage
 * 输入：
 * - params.category：COMMERCIAL | RECRUITMENT
 * - params.limit：可选条数上限
 * 输出：
 * - 返回值：UseProjectFeedDataResult
 * - 副作用：发起网络请求
 */
export function useProjectFeedData({ category, limit }: UseProjectFeedDataParams): UseProjectFeedDataResult {
  const [loadState, setLoadState] = useState<FeedLoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])

  useEffect(() => {
    let isCancelled = false

    async function loadProjectFeed(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const feedProjects = await getProjectFeed({ category, limit })
        if (isCancelled) {
          return
        }

        setProjects(mapFeedProjects(feedProjects ?? []))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const message = error instanceof FeedApiError ? error.message : '加载项目推荐失败，请稍后重试'
        setErrorMessage(message)
        setLoadState('error')
      }
    }

    void loadProjectFeed()

    return () => {
      isCancelled = true
    }
  }, [category, limit])

  return {
    loadState,
    errorMessage,
    projects,
  }
}
