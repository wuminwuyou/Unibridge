import { useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import TopNavbar from '../../layout/TopNavbar'
import { useFeedViewDetailReport } from '../../api/feed/useFeedViewDetailReport'
import { loadProjectDetailPreview } from './projectDetailPreviewSession'
import { ProjectDetailView } from './ProjectDetailView'
import type { ProjectDetailLocationState, ProjectDetailPayload } from './types'
import { parseProjectDetailUidFromQuery, useProjectDetailFromApi } from './useProjectDetailFromApi'
import '../../styles/DetailPage.css'

// 01）由 URL 查询参数构建占位详情（buildFallbackFromSearch）
function buildFallbackFromSearch(title: string | null): ProjectDetailPayload | null {
  const normalized = title?.trim()
  if (!normalized) {
    return null
  }

  return {
    title: normalized,
    summary: '该项目来自卡片链接，完整详情待后端接口接入。',
    channel: 'enterprise',
    channelLabel: '企业实战',
    description: '',
    descriptionEditorType: 'MARKDOWN',
    amount: '—',
    level: 'R',
    duration: '—',
    teamSize: '—',
    skillTags: [],
    deadline: '—',
    publishStatus: 'PUBLISHED',
    updatedAt: new Date().toISOString(),
  }
}

// 03）判断是否来自发布页（resolveProjectEditorialFlow）
function resolveProjectEditorialFlow(
  hasRoutePayload: boolean,
  hasProjectUidQuery: boolean,
  hasTitleQuery: boolean,
): boolean {
  if (hasRoutePayload) {
    return true
  }
  if (hasProjectUidQuery || hasTitleQuery) {
    return false
  }
  return loadProjectDetailPreview() != null
}

// 04）项目详情页（ProjectDetailPage）
/**
 * 函数名：ProjectDetailPage
 * 功能：展示项目详情，支持 Markdown / 富文本双模式正文阅读。
 * 实现方法：
 * - 优先读取路由 state / sessionStorage 预览数据（发布页跳转）
 * - 其次 GET /projects/{uid}（query uid）
 * - 回退至 URL title 查询参数（项目卡片链接）
 */
function ProjectDetailPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const routeState = location.state as ProjectDetailLocationState | null
  const projectUidFromQuery = parseProjectDetailUidFromQuery(
    searchParams.get('uid'),
    searchParams.get('id'),
  )
  const titleFromQuery = searchParams.get('title')

  const previewPayload =
    projectUidFromQuery != null ? null : routeState?.payload ?? loadProjectDetailPreview()
  const shouldFetchFromApi = projectUidFromQuery != null
  const { loadState, errorMessage, payload: apiPayload } = useProjectDetailFromApi(
    shouldFetchFromApi ? projectUidFromQuery : null,
  )

  const project = useMemo<ProjectDetailPayload | null>(() => {
    if (previewPayload) {
      return previewPayload
    }

    if (shouldFetchFromApi) {
      if (loadState !== 'ready') {
        return null
      }
      return apiPayload
    }

    return buildFallbackFromSearch(titleFromQuery)
  }, [apiPayload, loadState, previewPayload, shouldFetchFromApi, titleFromQuery])

  const isEditorialFlow = resolveProjectEditorialFlow(
    Boolean(routeState?.payload),
    projectUidFromQuery != null,
    Boolean(titleFromQuery),
  )

  const showLoading = shouldFetchFromApi && loadState === 'loading'
  const showError = shouldFetchFromApi && loadState === 'error'

  const viewDetailTags = useMemo(() => {
    if (loadState === 'ready' && apiPayload) {
      return apiPayload.skillTags
    }
    return []
  }, [apiPayload, loadState])

  useFeedViewDetailReport({
    enabled: shouldFetchFromApi && loadState === 'ready' && projectUidFromQuery != null,
    targetType: 'PROJECT',
    targetUid: projectUidFromQuery,
    tags: viewDetailTags,
  })

  return (
    <div className={`detail-page ${isEditorialFlow ? 'detail-page--editorial' : ''}`.trim()}>
      {!isEditorialFlow ? <TopNavbar /> : null}
      {showLoading ? (
        <main className="detail-page-main">
          <section className="detail-card" aria-label="项目详情加载中">
            <p className="detail-card__label">项目详情</p>
            <h1>加载中…</h1>
            <p>正在从服务器获取项目内容。</p>
          </section>
        </main>
      ) : showError ? (
        <main className="detail-page-main">
          <section className="detail-card" aria-label="项目详情错误">
            <p className="detail-card__label">项目详情</p>
            <h1>加载失败</h1>
            <p>{errorMessage ?? '无法获取项目详情，请稍后重试。'}</p>
          </section>
        </main>
      ) : project ? (
        <ProjectDetailView project={project} isEditorialFlow={isEditorialFlow} />
      ) : (
        <main className="detail-page-main">
          <section className="detail-card" aria-label="项目详情信息">
            <p className="detail-card__label">项目详情</p>
            <h1>未找到项目</h1>
            <p>请从发布项目页保存草稿、预览或发布后查看，或通过有效标题链接访问。</p>
          </section>
        </main>
      )}
    </div>
  )
}

export default ProjectDetailPage
