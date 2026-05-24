import { useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import TopNavbar from '../../layout/TopNavbar'
import { loadProjectDetailPreview } from './projectDetailPreviewSession'
import { ProjectDetailView } from './ProjectDetailView'
import type { ProjectDetailLocationState, ProjectDetailPayload } from './types'
import { parseProjectDetailIdFromQuery, useProjectDetailFromApi } from './useProjectDetailFromApi'
import '../../styles/DetailPage.css'

// 01）顶部导航（navItems）
const navItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 02）由 URL 查询参数构建占位详情（buildFallbackFromSearch）
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
  hasProjectIdQuery: boolean,
  hasTitleQuery: boolean,
): boolean {
  if (hasRoutePayload) {
    return true
  }
  if (hasProjectIdQuery || hasTitleQuery) {
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
 * - 其次 GET /projects/{projectId}（query id）
 * - 回退至 URL title 查询参数（项目卡片链接）
 */
function ProjectDetailPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const routeState = location.state as ProjectDetailLocationState | null
  const projectIdFromQuery = parseProjectDetailIdFromQuery(searchParams.get('id'))
  const titleFromQuery = searchParams.get('title')

  const previewPayload =
    projectIdFromQuery != null ? null : routeState?.payload ?? loadProjectDetailPreview()
  const shouldFetchFromApi = projectIdFromQuery != null
  const { loadState, errorMessage, payload: apiPayload } = useProjectDetailFromApi(
    shouldFetchFromApi ? projectIdFromQuery : null,
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
    projectIdFromQuery != null,
    Boolean(titleFromQuery),
  )

  const showLoading = shouldFetchFromApi && loadState === 'loading'
  const showError = shouldFetchFromApi && loadState === 'error'

  return (
    <div className={`detail-page ${isEditorialFlow ? 'detail-page--editorial' : ''}`.trim()}>
      {!isEditorialFlow ? <TopNavbar navItems={navItems} /> : null}
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
