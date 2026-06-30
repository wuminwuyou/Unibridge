// 01）跳转项目详情（navigateToProjectDetail）
import type { NavigateFunction } from 'react-router-dom'
import type { ContentLongtext } from '@entities/editor/lib/contentLongtext'
import { saveProjectDetailPreview } from './projectDetailPreviewSession'
import { buildProjectDetailPayload } from './buildProjectDetailPayload'
import type { ProjectDetailLocationState, ProjectDetailPublishStatus } from './buildProjectDetailPayload'
import type { PublishProjectFormDraft } from '../model/types'

// 02）navigateToProjectDetail
export function navigateToProjectDetail(
  navigate: NavigateFunction,
  draft: PublishProjectFormDraft,
  descriptionContent: ContentLongtext,
  publishStatus: ProjectDetailPublishStatus,
): void {
  const payload = buildProjectDetailPayload(
    draft, descriptionContent.longtext, descriptionContent.editorType, publishStatus,
  )
  saveProjectDetailPreview(payload)
  const state: ProjectDetailLocationState = { payload }
  navigate('/project/detail', { state })
}
