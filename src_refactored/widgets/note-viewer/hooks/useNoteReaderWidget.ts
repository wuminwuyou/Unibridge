import { useMemo } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useNoteDetail } from '@entities/note'
import type { NoteDetailPayload, NoteDetailLocationState } from '@entities/note'
import { loadNoteDetailPreview } from '@features/note-publish'
import { buildNoteArticleDetailFallback } from '@features/note-viewer-fallback'
import type { NoteResourceUid } from '@shared/api/resourceUid'
import { isNoteResourceUid, parseNoteUidFromQuery } from '@shared/api/resourceUid'

// 01）判断是否来自发布页（resolveNoteEditorialFlow）
function resolveNoteEditorialFlow(
  routeState: NoteDetailLocationState | null,
  hasNoteUidQuery: boolean,
  hasTitleQuery: boolean,
): boolean {
  if (routeState?.fromPublishEditor) {
    return true
  }
  if (routeState?.payload) {
    return true
  }
  if (hasNoteUidQuery || hasTitleQuery) {
    return false
  }
  return loadNoteDetailPreview() != null
}

// 02）笔记阅读 Widget Hook 返回值（UseNoteReaderWidgetResult）
export interface UseNoteReaderWidgetResult {
  isEditorialFlow: boolean
  showLoading: boolean
  showError: boolean
  errorMessage: string | null
  payload: NoteDetailPayload | null
}

// 03）笔记阅读 Widget 数据 Hook（useNoteReaderWidget）
/**
 * 函数名：useNoteReaderWidget
 * 功能：解析路由参数、预览 session 与 API，产出笔记阅读载荷。
 * 实现方法：
 * - 从 useParams 获取 URI id
 * - 优先 route state → session → API → fallback
 * 输入：无
 * 输出：
 * - 返回值：UseNoteReaderWidgetResult
 */
export function useNoteReaderWidget(): UseNoteReaderWidgetResult {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const routeState = location.state as NoteDetailLocationState | null

  const paramId = id ?? null
  const noteUidFromQuery: NoteResourceUid | null =
    isNoteResourceUid(paramId)
      ? paramId
      : parseNoteUidFromQuery(searchParams.get('uid'), searchParams.get('id'))

  const titleFromQuery = searchParams.get('title')

  const previewPayload =
    noteUidFromQuery != null ? null : routeState?.payload ?? loadNoteDetailPreview()
  const shouldFetchFromApi = noteUidFromQuery != null
  const { loadState, errorMessage, payload: apiPayload } = useNoteDetail(
    shouldFetchFromApi ? noteUidFromQuery : null,
  )

  const resolvedPayload = useMemo((): NoteDetailPayload | null => {
    if (shouldFetchFromApi && loadState !== 'ready') {
      return null
    }
    if (previewPayload) {
      return previewPayload
    }
    if (apiPayload) {
      return apiPayload
    }
    if (titleFromQuery) {
      return buildNoteArticleDetailFallback(titleFromQuery)
    }
    return null
  }, [shouldFetchFromApi, loadState, previewPayload, apiPayload, titleFromQuery])

  const isEditorialFlow = resolveNoteEditorialFlow(
    routeState,
    noteUidFromQuery != null,
    Boolean(titleFromQuery),
  )

  const showLoading = shouldFetchFromApi && loadState === 'loading'
  const showError = shouldFetchFromApi && loadState === 'error'

  return {
    isEditorialFlow,
    showLoading,
    showError,
    errorMessage,
    payload: resolvedPayload,
  }
}
