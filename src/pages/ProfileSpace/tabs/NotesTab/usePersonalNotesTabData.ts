import { useEffect, useState } from 'react'
import { getUserProfileNotes, UserProfileApiError } from '../../../../api/userProfile'
import { mapApiNotes } from '../../components/mapProfileTabData'
import type { ProfileTabLoadState } from '../../components/profileTabLoadState'
import type { ProfileNoteItem } from '../../components/types'

// 01）个人笔记 Tab 数据 Hook 返回值（UsePersonalNotesTabDataResult）
export interface UsePersonalNotesTabDataResult {
  loadState: ProfileTabLoadState
  errorMessage: string | null
  notes: ProfileNoteItem[]
  total: number | null
}

// 02）个人笔记 Tab 数据 Hook（usePersonalNotesTabData）
/**
 * 函数名：usePersonalNotesTabData
 * 功能：在「笔记」Tab 激活时拉取 /user-profile/notes 列表数据。
 * 输出：
 * - 返回值：UsePersonalNotesTabDataResult
 * - 副作用：发起网络请求
 */
export function usePersonalNotesTabData(): UsePersonalNotesTabDataResult {
  const [loadState, setLoadState] = useState<ProfileTabLoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadNotesTabData(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)

      try {
        const notesData = await getUserProfileNotes({ page: 1, pageSize: 20 })
        if (isCancelled) {
          return
        }

        setNotes(mapApiNotes(notesData.notes))
        setTotal(notesData.total ?? null)
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const message =
          error instanceof UserProfileApiError ? error.message : '加载笔记列表失败，请稍后重试'
        setErrorMessage(message)
        setLoadState('error')
      }
    }

    void loadNotesTabData()

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    loadState,
    errorMessage,
    notes,
    total,
  }
}
