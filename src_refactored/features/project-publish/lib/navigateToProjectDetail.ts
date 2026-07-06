// 01）跳转项目详情（navigateToProjectDetail）
import type { NavigateFunction } from 'react-router-dom'
import type { ContentLongtext } from '@entities/editor/lib/contentLongtext'
import type { ProjectResourceUid } from '@shared/api/resourceUid'
import { buildProjectDetailPath } from '@shared/lib/projectRoutes'
import { saveProjectDetailPreview } from './projectDetailPreviewSession'
import { buildProjectDetailPayload } from './buildProjectDetailPayload'
import type { ProjectDetailLocationState, ProjectDetailPublishStatus } from '@entities/project'
import type { PublishProjectFormDraft } from '../model/types'

// 02）navigateToProjectDetail
/**
 * 函数名：navigateToProjectDetail
 * 功能：保存预览载荷并跳转至 RESTful 项目详情页 `/projects/:id`。
 * 输入：
 * - navigate / draft / descriptionContent / publishStatus / projectUid
 * 输出：
 * - 副作用：写入 sessionStorage 并路由跳转
 */
export function navigateToProjectDetail(
  navigate: NavigateFunction,
  draft: PublishProjectFormDraft,
  descriptionContent: ContentLongtext,
  publishStatus: ProjectDetailPublishStatus,
  projectUid: ProjectResourceUid,
  contentDetailContent?: ContentLongtext,
): void {
  const payload = buildProjectDetailPayload(
    draft, descriptionContent.longtext, descriptionContent.editorType, publishStatus, contentDetailContent?.longtext,
  )
  saveProjectDetailPreview(payload)
  const state: ProjectDetailLocationState = { payload }
  navigate(buildProjectDetailPath(projectUid), { state })
}
