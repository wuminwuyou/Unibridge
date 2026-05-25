import { useEffect, useState } from 'react'
import { getNoteDetail, NotesApiError } from '../../api/notes'
import type { NoteResourceUid } from '../../api/resourceUid'
import type { NoteDetailPayload } from './shared/noteDetailPayload'
import { mapNoteDetailToPayload } from './shared/mapNoteDetailToPayload'

// 01）笔记阅读 API 加载状态（NoteReaderApiLoadState）
export type NoteReaderApiLoadState = 'idle' | 'loading' | 'error' | 'ready'

// 02）笔记阅读 API Hook 返回值（UseNoteReaderFromApiResult）
export interface UseNoteReaderFromApiResult {
  loadState: NoteReaderApiLoadState
  errorMessage: string | null
  payload: NoteDetailPayload | null
}

// 03）从 API 加载笔记阅读数据（useNoteReaderFromApi）
/**
 * 函数名：useNoteReaderFromApi
 * 功能：当路由携带 note uid 时调用 GET /notes/{uid} 并映射为阅读页载荷。
 * 实现方法：
 * - noteUid 为空时不请求（idle）
 * - useEffect 内 fetch，支持卸载 cancel
 * 输入：
 * - noteUid：笔记对外 uid，null 时跳过
 * 输出：
 * - 返回值：加载状态、错误信息与 NoteDetailPayload
 */
export function useNoteReaderFromApi(noteUid: NoteResourceUid | null): UseNoteReaderFromApiResult {
  const [loadState, setLoadState] = useState<NoteReaderApiLoadState>(noteUid ? 'loading' : 'idle')
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

    async function loadNoteReaderData(): Promise<void> {
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

    void loadNoteReaderData()

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
