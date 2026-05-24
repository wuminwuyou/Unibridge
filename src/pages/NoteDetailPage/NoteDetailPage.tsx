import { useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import TopNavbar from '../../layout/TopNavbar'
import { useFeedViewDetailReport } from '../../api/feed/useFeedViewDetailReport'
import { NoteArticleDetailView, resolveNoteArticleDetail } from './NoteArticleDetail'
import { NoteVideoDetailView, resolveNoteVideoDetail } from './NoteVideoDetail'
import { loadNoteDetailPreview } from './shared/noteDetailPreviewSession'
import type { NoteDetailLocationState } from './shared/noteDetailPayload'
import { parseNoteDetailUidFromQuery } from './shared/noteDetailRouting'
import { useNoteDetailFromApi } from './useNoteDetailFromApi'
import '../../styles/DetailPage.css'

// 01）判断是否来自发布页（resolveNoteEditorialFlow）
function resolveNoteEditorialFlow(hasRoutePayload: boolean, hasNoteUidQuery: boolean, hasTitleQuery: boolean): boolean {
  if (hasRoutePayload) {
    return true
  }
  if (hasNoteUidQuery || hasTitleQuery) {
    return false
  }
  return loadNoteDetailPreview() != null
}

// 03）笔记详情路由入口（NoteDetailPage）
/**
 * 函数名：NoteDetailPage
 * 功能：笔记详情路由入口，按 contentType 分发图文 / 视频详情页。
 * 实现方法：
 * - 优先 location.state / sessionStorage 预览数据
 * - 其次 GET /notes/{uid}（query uid）
 * - 回退 URL query（title、contentType）并填充演示数据
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
function NoteDetailPage() {
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
  const { loadState, errorMessage, payload: apiPayload } = useNoteDetailFromApi(
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
    Boolean(routeState?.payload),
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

  return (
    <div className={`detail-page ${isEditorialFlow ? 'detail-page--editorial' : ''}`.trim()}>
      {!isEditorialFlow ? <TopNavbar /> : null}
      {showLoading ? (
        <main className="detail-page-main">
          <section className="detail-card" aria-label="笔记详情加载中">
            <p className="detail-card__label">笔记详情</p>
            <h1>加载中…</h1>
            <p>正在从服务器获取笔记内容。</p>
          </section>
        </main>
      ) : showError ? (
        <main className="detail-page-main">
          <section className="detail-card" aria-label="笔记详情错误">
            <p className="detail-card__label">笔记详情</p>
            <h1>加载失败</h1>
            <p>{errorMessage ?? '无法获取笔记详情，请稍后重试。'}</p>
          </section>
        </main>
      ) : articleNote ? (
        <NoteArticleDetailView note={articleNote} isEditorialFlow={isEditorialFlow} />
      ) : videoNote ? (
        <NoteVideoDetailView note={videoNote} isEditorialFlow={isEditorialFlow} />
      ) : (
        <main className="detail-page-main">
          <section className="detail-card" aria-label="笔记详情信息">
            <p className="detail-card__label">笔记详情</p>
            <h1>未找到笔记</h1>
            <p>请从经验分享频道进入，或在发布笔记页预览后查看。</p>
          </section>
        </main>
      )}
    </div>
  )
}

export default NoteDetailPage
