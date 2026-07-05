import { useEffect, useState } from 'react'
import { getNoteDetail, NotesApiError } from '../api/noteApi'
import type { NoteResourceUid } from '../../../shared/api/resourceUid'
import type { NoteDetailPayload } from './noteDetailViewModel'
import { mapNoteDetailToPayload } from '../lib/mapNoteDetailToPayload'

// 01）笔记详情加载状态（NoteDetailLoadState）
export type NoteDetailLoadState = 'idle' | 'loading' | 'error' | 'ready'

// 02）笔记详情 Hook 返回值（UseNoteDetailResult）
export interface UseNoteDetailResult {
  loadState: NoteDetailLoadState
  errorMessage: string | null
  payload: NoteDetailPayload | null
}

// 03）从 API 加载笔记详情（useNoteDetail）
/**
 * 函数名：useNoteDetail
 * 功能：当传入 noteUid 时调用 GET /notes/{uid} 并映射为笔记详情载荷。
 * 实现方法：
 * - noteUid 为空时不请求（idle）
 * - useEffect 内 fetch，支持卸载 cancel
 * 输入：
 * - noteUid：笔记对外 uid，null 时跳过
 * 输出：
 * - 返回值：加载状态、错误信息与 NoteDetailPayload
 */
export function useNoteDetail(noteUid: NoteResourceUid | null): UseNoteDetailResult {
  const [loadState, setLoadState] = useState<NoteDetailLoadState>(noteUid ? 'loading' : 'idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [payload, setPayload] = useState<NoteDetailPayload | null>(null)

  useEffect(() => {
    if (!noteUid) {
      setLoadState('idle')
      setErrorMessage(null)
      setPayload(null)
      return
    }

    const activeNoteUid = noteUid
    let isCancelled = false

    async function loadNoteDetail(): Promise<void> {
      setLoadState('loading')
      setErrorMessage(null)
      setPayload(null)

      try {
        const dto = await getNoteDetail(activeNoteUid)
        const nextPayload = mapNoteDetailToPayload(dto)
        if (isCancelled) {
          return
        }

        setPayload(nextPayload)
        setLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const message = error instanceof NotesApiError ? error.message : '加载笔记内容失败，请稍后重试'
        setErrorMessage(message)
        setLoadState('error')
      }
    }

    void loadNoteDetail()

    return () => {
      isCancelled = true
    }
  }, [noteUid])

  return {
    loadState,
    errorMessage,
    payload,
  }
}
