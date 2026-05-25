import { createProject, ProjectsApiError, updateProject } from '../../api/projects'
import { buildUpsertProjectRequest } from '../../api/projects/types'
import type { ProjectPublishAction } from '../../api/projects/types'
import { isProjectResourceUid } from '../../api/resourceUid'
import type { ProjectResourceUid } from '../../api/resourceUid'
import type { ContentLongtext } from '../../components/Reader'
import { resolvePublishSummary } from '../../utils/publishSummary'
import type { PublishProjectFormDraft } from './publishProjectPageData'

// 01）校验项目提交表单（validatePublishProjectSubmit）
/**
 * 函数名：validatePublishProjectSubmit
 * 功能：按 publishAction 校验发布项目表单。
 */
export function validatePublishProjectSubmit(
  draft: PublishProjectFormDraft,
  descriptionContent: ContentLongtext,
  publishAction: ProjectPublishAction,
): string | null {
  if (!draft.title.trim()) {
    return '请填写项目标题'
  }

  if (publishAction === 'DRAFT') {
    return null
  }

  if (!descriptionContent.longtext.trim()) {
    return '请填写项目需求说明'
  }

  const resolvedSummary = resolvePublishSummary(draft.summary, descriptionContent.longtext)
  if (!resolvedSummary) {
    return '请填写项目摘要，或确保需求说明含有可提取的文字内容'
  }

  if (!draft.amount.trim()) {
    return '请填写项目预算'
  }

  if (draft.skillTags.length === 0) {
    return '请至少添加 1 个技能标签'
  }

  return null
}

// 02）提交发布项目（submitPublishProject）
/**
 * 函数名：submitPublishProject
 * 功能：调用 POST/PUT /projects 保存草稿或发布项目。
 */
export async function submitPublishProject(options: {
  draft: PublishProjectFormDraft
  descriptionContent: ContentLongtext
  projectUid?: ProjectResourceUid | null
  publishAction: ProjectPublishAction
}): Promise<{ projectUid: ProjectResourceUid }> {
  const validationError = validatePublishProjectSubmit(
    options.draft,
    options.descriptionContent,
    options.publishAction,
  )
  if (validationError) {
    throw new ProjectsApiError(400, validationError)
  }

  const payload = buildUpsertProjectRequest(
    options.draft,
    options.descriptionContent.longtext,
    options.publishAction,
  )

  const response =
    isProjectResourceUid(options.projectUid)
      ? await updateProject(options.projectUid, payload)
      : await createProject(payload)

  return { projectUid: response.uid }
}

export { ProjectsApiError }
