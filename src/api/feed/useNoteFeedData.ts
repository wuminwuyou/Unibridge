import { useCallback, useEffect, useState } from 'react'
import type { ProfileNoteItem } from '../../pages/ProfileSpace/components/types'
import { useActionCooldown } from '../../hooks/useActionCooldown'
import { FEED_SHUFFLE_COOLDOWN_MS } from './constants'
import { createShuffleSeed, FeedApiError, getNoteFeed, mapFeedNotes, shuffleNoteFeed } from './index'
import type { FeedLoadState, FeedNoteType } from './types'

// 01）笔记 Feed Hook 参数（UseNoteFeedDataParams）
export interface UseNoteFeedDataParams {
  noteType: FeedNoteType
  limit?: number
  shuffleSize?: number
  shuffleCooldownMs?: number
}

// 02）笔记 Feed Hook 返回值（UseNoteFeedDataResult）
export interface UseNoteFeedDataResult {
  loadState: FeedLoadState
  isShuffling: boolean
  isShuffleCooldown: boolean
  shuffleCooldownSeconds: number
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
 * - shuffleNotes 传 seed + page=1 请求 shuffleNoteFeed（机制 B）
 * - 换一换完成后启动冷却，防止连点
 * 输入：
 * - params.noteType：IMAGE_TEXT | VIDEO
 * - params.limit：首次加载条数
 * - params.shuffleSize：换一换每页条数
 * - params.shuffleCooldownMs：换一换冷却毫秒数
 * 输出：
 * - 返回值：UseNoteFeedDataResult
 * - 副作用：发起网络请求
 */
export function useNoteFeedData({
  noteType,
  limit = 10,
  shuffleSize = 10,
  shuffleCooldownMs = FEED_SHUFFLE_COOLDOWN_MS,
}: UseNoteFeedDataParams): UseNoteFeedDataResult {
  const [loadState, setLoadState] = useState<FeedLoadState>('loading')
  const [isShuffling, setIsShuffling] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const {
    isOnCooldown: isShuffleCooldown,
    remainingSeconds: shuffleCooldownSeconds,
    startCooldown: startShuffleCooldown,
    resetCooldown: resetShuffleCooldown,
  } = useActionCooldown({ cooldownMs: shuffleCooldownMs })

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
        resetShuffleCooldown()
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
  }, [limit, noteType, resetShuffleCooldown])

  const shuffleNotes = useCallback(() => {
    if (isShuffling || isShuffleCooldown) {
      return
    }

    void (async () => {
      setIsShuffling(true)
      setErrorMessage(null)

      try {
        const shuffleResult = await shuffleNoteFeed({
          noteType,
          page: 1,
          size: shuffleSize,
          seed: createShuffleSeed(),
        })

        const shuffledNotes = mapFeedNotes(shuffleResult.items ?? [])
        setNotes(shuffledNotes)
      } catch (error) {
        const message = error instanceof FeedApiError ? error.message : '换一换失败，请稍后重试'
        setErrorMessage(message)
      } finally {
        setIsShuffling(false)
        startShuffleCooldown()
      }
    })()
  }, [isShuffling, isShuffleCooldown, noteType, shuffleSize, startShuffleCooldown])

  return {
    loadState,
    isShuffling,
    isShuffleCooldown,
    shuffleCooldownSeconds,
    errorMessage,
    notes,
    shuffleNotes,
  }
}
