import { useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useFeedViewDetailReport } from '../../api/feed/useFeedViewDetailReport'
import { resolveNoteArticleDetail } from './NoteArticleDetail'
import { resolveNoteVideoDetail } from './NoteVideoDetail'
import { loadNoteDetailPreview } from './shared/noteDetailPreviewSession'
import type { NoteDetailLocationState } from './shared/noteDetailPayload'
import { parseNoteDetailUidFromQuery } from './shared/noteDetailRouting'
import { useNoteReaderFromApi } from './useNoteReaderFromApi'

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

// 02）笔记阅读页 Hook 返回值（UseNoteReaderPageResult）
export interface UseNoteReaderPageResult {
  isEditorialFlow: boolean
  showLoading: boolean
  showError: boolean
  errorMessage: string | null
  articleNote: ReturnType<typeof resolveNoteArticleDetail>
  videoNote: ReturnType<typeof resolveNoteVideoDetail>
}

// 03）笔记阅读页数据 Hook（useNoteReaderPage）
/**
 * 函数名：useNoteReaderPage
 * 功能：解析路由参数、预览 session 与 API，产出图文/视频阅读载荷。
 * 实现方法：
 * - 优先 GET /notes/{uid}；无 uid 时回退 session / route state 预览数据
 * 输入：无
 * 输出：
 * - 返回值：UseNoteReaderPageResult
 * - 副作用：可能触发 VIEW_DETAIL 埋点
 */
export function useNoteReaderPage(): UseNoteReaderPageResult {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const routeState = location.state as NoteDetailLocationState | null
  const noteUidFromQuery = parseNoteDetailUidFromQuery(
    searchParams.get('uid'),
    searchParams.get('id'),
  )
  const titleFromQuery = searchParams.get('title')
  const contentTypeFromQuery = searchParams.get('contentType')

  const previewPayload =
    noteUidFromQuery != null ? null : routeState?.payload ?? loadNoteDetailPreview()
  const shouldFetchFromApi = noteUidFromQuery != null
  const { loadState, errorMessage, payload: apiPayload } = useNoteReaderFromApi(
    shouldFetchFromApi ? noteUidFromQuery : null,
  )

  const resolvedPayload = previewPayload ?? apiPayload

  const articleNote = useMemo(() => {
    if (shouldFetchFromApi && loadState !== 'ready') {
      return null
    }
    return resolveNoteArticleDetail(resolvedPayload, contentTypeFromQuery, titleFromQuery)
  }, [contentTypeFromQuery, loadState, resolvedPayload, shouldFetchFromApi, titleFromQuery])

  const videoNote = useMemo(() => {
    if (shouldFetchFromApi && loadState !== 'ready') {
      return null
    }
    return resolveNoteVideoDetail(resolvedPayload, contentTypeFromQuery, titleFromQuery)
  }, [contentTypeFromQuery, loadState, resolvedPayload, shouldFetchFromApi, titleFromQuery])

  const isEditorialFlow = resolveNoteEditorialFlow(
    routeState,
    noteUidFromQuery != null,
    Boolean(titleFromQuery),
  )

  const showLoading = shouldFetchFromApi && loadState === 'loading'
  const showError = shouldFetchFromApi && loadState === 'error'

  const viewDetailTags = useMemo(() => {
    if (loadState === 'ready' && apiPayload) {
      return apiPayload.tags ?? []
    }
    return []
  }, [apiPayload, loadState])

  useFeedViewDetailReport({
    enabled: shouldFetchFromApi && loadState === 'ready' && noteUidFromQuery != null,
    targetType: 'NOTE',
    targetUid: noteUidFromQuery,
    tags: viewDetailTags,
  })

  return {
    isEditorialFlow,
    showLoading,
    showError,
    errorMessage,
    articleNote,
    videoNote,
  }
}
