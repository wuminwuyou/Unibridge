import { useEffect, useState } from 'react'
import { FeedApiError, getHomeFeed, mapFeedNotes, mapFeedProjects } from './index'
import type { FeedLoadState } from './types'
import type { ProjectItem } from '../../types/project'
import type { ProfileNoteItem } from '../../pages/ProfileSpace/components/types'

// 01）首页 Feed Hook 返回值（UseHomeFeedDataResult）
export interface UseHomeFeedDataResult {
  loadState: FeedLoadState
  errorMessage: string | null
  projects: ProjectItem[]
  notes: ProfileNoteItem[]
}

// 02）首页 Feed 数据 Hook（useHomeFeedData）
/**
 * 函数名：useHomeFeedData
 * 功能：挂载时拉取 GET /feed/home，映射为 ProjectItem 与 ProfileNoteItem。
 * 实现方法：
 * - useEffect 内请求并支持卸载 cancel
 * - 捕获 FeedApiError 写入 errorMessage
 * 输入：无
 * 输出：
 * - 返回值：UseHomeFeedDataResult
 * - 副作用：发起网络请求
 */
export function useHomeFeedData(): UseHomeFeedDataResult {
  const [loadState, setLoadState] = useState<FeedLoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])

  useEffect(() => {
    let isCancelled = false

    async function loadHomeFeed(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const homeFeed = await getHomeFeed()
        if (isCancelled) {
          return
        }

        setProjects(mapFeedProjects(homeFeed.projects ?? []))
        setNotes(mapFeedNotes(homeFeed.notes ?? []))
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const message = error instanceof FeedApiError ? error.message : '加载首页推荐失败，请稍后重试'
        setErrorMessage(message)
        setLoadState('error')
      }
    }

    void loadHomeFeed()

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    loadState,
    errorMessage,
    projects,
    notes,
  }
}
