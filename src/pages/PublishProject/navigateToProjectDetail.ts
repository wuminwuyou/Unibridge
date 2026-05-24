import type { NavigateFunction } from 'react-router-dom'
import type { ContentLongtext } from '../../components/Reader'
import { saveProjectDetailPreview } from '../ProjectDetailPage/projectDetailPreviewSession'
import type { ProjectDetailLocationState, ProjectDetailPublishStatus } from '../ProjectDetailPage/types'
import { buildProjectDetailPayload } from '../ProjectDetailPage/buildProjectDetailPayload'
import type { PublishProjectFormDraft } from './publishProjectPageData'

// 01）跳转项目详情（navigateToProjectDetail）
/**
 * 函数名：navigateToProjectDetail
 * 功能：将当前发布表单快照写入 session 并跳转项目详情页。
 * 输入：
 * - navigate：react-router navigate
 * - draft / descriptionContent / publishStatus
 * 输出：
 * - 副作用：路由跳转；sessionStorage 写入预览数据
 */
export function navigateToProjectDetail(
  navigate: NavigateFunction,
  draft: PublishProjectFormDraft,
  descriptionContent: ContentLongtext,
  publishStatus: ProjectDetailPublishStatus,
): void {
  const payload = buildProjectDetailPayload(draft, descriptionContent, publishStatus)
  saveProjectDetailPreview(payload)

  const state: ProjectDetailLocationState = { payload }
  navigate('/project-detail', { state })
}
