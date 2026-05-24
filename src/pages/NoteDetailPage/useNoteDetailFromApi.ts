import { useEffect, useState } from 'react'
import { getNoteDetail, NotesApiError } from '../../api/notes'
import type { NoteResourceUid } from '../../api/resourceUid'
import type { NoteDetailPayload } from './shared/noteDetailPayload'
import { mapNoteDetailToPayload } from './shared/mapNoteDetailToPayload'

// 01）笔记详情 API 加载状态（NoteDetailApiLoadState）
export type NoteDetailApiLoadState = 'idle' | 'loading' | 'error' | 'ready'

// 02）笔记详情 API Hook 返回值（UseNoteDetailFromApiResult）
export interface UseNoteDetailFromApiResult {
  loadState: NoteDetailApiLoadState
  errorMessage: string | null
  payload: NoteDetailPayload | null
}

// 03）从 API 加载笔记详情（useNoteDetailFromApi）
/**
 * 函数名：useNoteDetailFromApi
 * 功能：当路由携带 note uid 时调用 GET /notes/{uid} 并映射为页面载荷。
 * 实现方法：
 * - noteUid 为空时不请求（idle）
 * - useEffect 内 fetch，支持卸载 cancel
 * 输入：
 * - noteUid：笔记对外 uid，null 时跳过
 * 输出：
 * - 返回值：加载状态、错误信息与 NoteDetailPayload
 */
export function useNoteDetailFromApi(noteUid: NoteResourceUid | null): UseNoteDetailFromApiResult {
  const [loadState, setLoadState] = useState<NoteDetailApiLoadState>(noteUid ? 'loading' : 'idle')
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

        const message = error instanceof NotesApiError ? error.message : '加载笔记详情失败，请稍后重试'
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
