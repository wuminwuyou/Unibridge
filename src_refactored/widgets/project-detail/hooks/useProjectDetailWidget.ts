// 01）项目详情编排 Hook（useProjectDetailWidget）
// 职责：四路数据优先级合并 + editorial 判定 + 加载/错误状态 + 埋点触发
// 迁移自旧 ProjectDetailPage.tsx 全部业务编排逻辑

import { useMemo } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useProjectDetail } from '@entities/project'
import { useProjectDetailViewReport } from '@entities/project'
import { loadProjectDetailPreview } from '@features/project-publish'
import { parseProjectDetailRouteParam, buildFallbackProjectDetail } from '@entities/project'
import type { ProjectDetailPayload, ProjectDetailLocationState } from '@entities/project'

// 02）Widget ViewModel 输出类型（ProjectDetailWidgetViewModel）
export interface ProjectDetailWidgetViewModel {
  project: ProjectDetailPayload | null
  isEditorialFlow: boolean
  showLoading: boolean
  showError: boolean
  errorMessage: string | null
}

// 03）判断是否来自发布页编辑回流（resolveProjectEditorialFlow）
/**
 * 函数名：resolveProjectEditorialFlow
 * 功能：根据路由携带的参数判断当前是否为发布页预览/草稿回流。
 * 实现方法：
 * - 有 route state payload → 来自发布页跳转
 * - 有合法 uid 或 title 参数 → 非编辑回流（走 API 或回退）
 * - 无上述 → 检查 sessionStorage 是否有预览数据
 * 输入：
 * - hasRoutePayload：route state 是否携带 payload
 * - hasProjectUid：路由 id 是否为有效 uid
 * - hasTitleFallback：路由 id 是否为 title 回退
 * 输出：
 * - 返回值：boolean
 */
function resolveProjectEditorialFlow(
  hasRoutePayload: boolean,
  hasProjectUid: boolean,
  hasTitleFallback: boolean,
): boolean {
  if (hasRoutePayload) {
    return true
  }
  if (hasProjectUid || hasTitleFallback) {
    return false
  }
  return loadProjectDetailPreview() != null
}

// 04）useProjectDetailWidget
/**
 * 函数名：useProjectDetailWidget
 * 功能：项目详情页核心编排 Hook——多源数据合并、模式判定、埋点触发。
 * 实现方法：
 * - parseProjectDetailRouteParam 解析 /projects/:id
 * - 读取 route state（发布页跳转 payload）
 * - 读取 sessionStorage preview（刷新回退）
 * - 调用 useProjectDetail API Hook
 * - useMemo 四路优先级合并（state > session > API > title 回退）
 * - 判定 isEditorialFlow（是否隐藏 TopNavbar、展示 editorial banner）
 * - 触发浏览埋点（API 加载完成 + uid 有效）
 * 输入：
 * - 无（内部从路由读取）
 * 输出：
 * - 返回值：ProjectDetailWidgetViewModel
 * - 副作用：埋点 Hook 内部可能发起 POST /feed/view
 */
export function useProjectDetailWidget(): ProjectDetailWidgetViewModel {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  // 1. 解析路由参数
  const { projectUid, titleFallback } = parseProjectDetailRouteParam(id)
  const routeState = location.state as ProjectDetailLocationState | null

  // 2. 预览数据：route state 优先于 sessionStorage（排除 API 场景）
  const previewPayload: ProjectDetailPayload | null =
    projectUid != null ? null : (routeState?.payload ?? loadProjectDetailPreview())

  // 3. API 加载
  const shouldFetchFromApi = projectUid != null
  const { loadState, errorMessage, payload: apiPayload } = useProjectDetail(
    shouldFetchFromApi ? projectUid : null,
  )

  // 4. 四路优先级合并
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

    return buildFallbackProjectDetail(titleFallback)
  }, [apiPayload, loadState, previewPayload, shouldFetchFromApi, titleFallback])

  // 5. editorial 判定
  const isEditorialFlow = resolveProjectEditorialFlow(
    Boolean(routeState?.payload),
    projectUid != null,
    titleFallback != null,
  )

  // 6. 埋点触发
  const viewDetailTags = useMemo(() => {
    if (loadState === 'ready' && apiPayload) {
      return apiPayload.skillTags
    }
    return []
  }, [apiPayload, loadState])

  useProjectDetailViewReport({
    enabled: shouldFetchFromApi && loadState === 'ready' && projectUid != null,
    projectUid,
    tags: viewDetailTags,
  })

  return {
    project,
    isEditorialFlow,
    showLoading: shouldFetchFromApi && loadState === 'loading',
    showError: shouldFetchFromApi && loadState === 'error',
    errorMessage,
  }
}
