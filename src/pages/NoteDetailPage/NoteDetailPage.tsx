import { useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import TopNavbar from '../../layout/TopNavbar'
import { NoteArticleDetailView, resolveNoteArticleDetail } from './NoteArticleDetail'
import { NoteVideoDetailView, resolveNoteVideoDetail } from './NoteVideoDetail'
import { loadNoteDetailPreview } from './shared/noteDetailPreviewSession'
import type { NoteDetailLocationState } from './shared/noteDetailPayload'
import { parseNoteDetailIdFromQuery } from './shared/noteDetailRouting'
import { useNoteDetailFromApi } from './useNoteDetailFromApi'
import '../../styles/DetailPage.css'

// 01）顶部导航（navItems）
const navItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 02）判断是否来自发布页（resolveNoteEditorialFlow）
function resolveNoteEditorialFlow(hasRoutePayload: boolean, hasNoteIdQuery: boolean, hasTitleQuery: boolean): boolean {
  if (hasRoutePayload) {
    return true
  }
  if (hasNoteIdQuery || hasTitleQuery) {
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
 * - 其次 GET /notes/{noteId}（query id）
 * - 回退 URL query（title、contentType）并填充演示数据
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
function NoteDetailPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const routeState = location.state as NoteDetailLocationState | null
  const noteIdFromQuery = parseNoteDetailIdFromQuery(searchParams.get('id'))
  const titleFromQuery = searchParams.get('title')
  const contentTypeFromQuery = searchParams.get('contentType')

  const previewPayload =
    noteIdFromQuery != null ? null : routeState?.payload ?? loadNoteDetailPreview()
  const shouldFetchFromApi = noteIdFromQuery != null
  const { loadState, errorMessage, payload: apiPayload } = useNoteDetailFromApi(
    shouldFetchFromApi ? noteIdFromQuery : null,
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
    noteIdFromQuery != null,
    Boolean(titleFromQuery),
  )

  const showLoading = shouldFetchFromApi && loadState === 'loading'
  const showError = shouldFetchFromApi && loadState === 'error'

  return (
    <div className={`detail-page ${isEditorialFlow ? 'detail-page--editorial' : ''}`.trim()}>
      {!isEditorialFlow ? <TopNavbar navItems={navItems} /> : null}
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
