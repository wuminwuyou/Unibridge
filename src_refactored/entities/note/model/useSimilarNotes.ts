import { useState, useEffect } from 'react'
import type { NoteResourceUid } from '../../../shared/api/resourceUid'
import { isNoteResourceUid } from '../../../shared/api/resourceUid'
import type { ProfileNoteItem } from './profileNoteItem'
import { getSimilarNotes } from '../api/noteFeedApi'
import { mapFeedNoteToProfileNoteItem } from '../lib/noteFeedMappers'

// 01）相似笔记 Hook 返回值（UseSimilarNotesResult）
export interface UseSimilarNotesResult {
  notes: ProfileNoteItem[]
  loading: boolean
}

const DEFAULT_LIMIT = 10

// 02）相似笔记推荐 Hook（useSimilarNotes）
/**
 * 函数名：useSimilarNotes
 * 功能：根据笔记 uid 获取相似笔记推荐列表。
 * 实现方法：
 * - uid 无效时跳过
 * - useEffect 调用 getSimilarNotes API 并映射为 ProfileNoteItem[]
 * 输入：
 * - noteUid：源笔记 uid（可为 null）
 * - limit：返回条数，默认 3
 * 输出：
 * - 返回值：UseSimilarNotesResult
 * - 副作用：发起 HTTP 请求
 */
export function useSimilarNotes(noteUid: NoteResourceUid | null, limit = DEFAULT_LIMIT): UseSimilarNotesResult {
  const [notes, setNotes] = useState<ProfileNoteItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isNoteResourceUid(noteUid)) {
      return
    }

    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        const items = await getSimilarNotes(noteUid!, limit)
        if (!cancelled) {
          setNotes(items.map(mapFeedNoteToProfileNoteItem))
        }
      } catch {
        if (!cancelled) {
          setNotes([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [noteUid, limit])

  return { notes, loading }
}
