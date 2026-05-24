import { useCallback, useEffect, useState } from 'react'
import type { ProfileNoteItem } from '../../pages/ProfileSpace/components/types'
import { FeedApiError, getNoteFeed, mapFeedNotes, shuffleNoteFeed } from './index'
import type { FeedLoadState, FeedNoteType } from './types'

// 01）笔记 Feed Hook 参数（UseNoteFeedDataParams）
export interface UseNoteFeedDataParams {
  noteType: FeedNoteType
  limit?: number
  shuffleSize?: number
}

// 02）笔记 Feed Hook 返回值（UseNoteFeedDataResult）
export interface UseNoteFeedDataResult {
  loadState: FeedLoadState
  isShuffling: boolean
  errorMessage: string | null
  notes: ProfileNoteItem[]
  shuffleNotes: () => void
}

// 03）笔记专区 Feed 数据 Hook（useNoteFeedData）
/**
 * 函数名：useNoteFeedData
 * 功能：拉取 GET /feed/notes 并支持「换一换」调用 shuffle 接口。
 * 实现方法：
 * - 首次加载走 getNoteFeed
 * - shuffleNotes 递增 page 请求 shuffleNoteFeed（机制 A）
 * - pageWrapped 时重置 page 为 1
 * 输入：
 * - params.noteType：IMAGE_TEXT | VIDEO
 * - params.limit：首次加载条数
 * - params.shuffleSize：换一换每页条数
 * 输出：
 * - 返回值：UseNoteFeedDataResult
 * - 副作用：发起网络请求
 */
export function useNoteFeedData({
  noteType,
  limit = 10,
  shuffleSize = 10,
}: UseNoteFeedDataParams): UseNoteFeedDataResult {
  const [loadState, setLoadState] = useState<FeedLoadState>('loading')
  const [isShuffling, setIsShuffling] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const [shufflePage, setShufflePage] = useState(1)

  useEffect(() => {
    let isCancelled = false

    async function loadNoteFeed(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const feedNotes = await getNoteFeed({ noteType, limit })
        if (isCancelled) {
          return
        }

        setNotes(mapFeedNotes(feedNotes ?? []))
        setShufflePage(1)
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const message = error instanceof FeedApiError ? error.message : '加载笔记推荐失败，请稍后重试'
        setErrorMessage(message)
        setLoadState('error')
      }
    }

    void loadNoteFeed()

    return () => {
      isCancelled = true
    }
  }, [limit, noteType])

  const shuffleNotes = useCallback(() => {
    void (async () => {
      setIsShuffling(true)
      setErrorMessage(null)

      try {
        const nextPage = shufflePage + 1
        const shuffleResult = await shuffleNoteFeed({
          noteType,
          page: nextPage,
          size: shuffleSize,
        })

        const shuffledNotes = mapFeedNotes(shuffleResult.items ?? [])
        setNotes(shuffledNotes)
        setShufflePage(shuffleResult.pageWrapped ? 1 : shuffleResult.page)
      } catch (error) {
        const message = error instanceof FeedApiError ? error.message : '换一换失败，请稍后重试'
        setErrorMessage(message)
      } finally {
        setIsShuffling(false)
      }
    })()
  }, [noteType, shufflePage, shuffleSize])

  return {
    loadState,
    isShuffling,
    errorMessage,
    notes,
    shuffleNotes,
  }
}
