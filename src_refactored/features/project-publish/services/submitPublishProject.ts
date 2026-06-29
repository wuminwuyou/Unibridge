// 01）提交 / 校验发布项目
import { createProject, updateProject, ProjectsApiError } from '@entities/project/api/projectApi'
import type { ProjectPublishAction } from '@entities/project/model/types'
import { isProjectResourceUid } from '@shared/api/resourceUid'
import type { ProjectResourceUid } from '@shared/api/resourceUid'
import type { ContentLongtext } from '@entities/editor/lib/contentLongtext'
import { buildUpsertProjectRequest } from '@entities/project/lib/buildUpsertProjectRequest'
import type { PublishProjectFormDraftForRequest } from '@entities/project/lib/buildUpsertProjectRequest'
import { resolvePublishSummary } from '@shared/lib/publishSummary'
import type { PublishProjectFormDraft } from '../model/types'

// 02）校验项目提交表单（validatePublishProjectSubmit）
export function validatePublishProjectSubmit(
  draft: PublishProjectFormDraft,
  descriptionContent: ContentLongtext,
  publishAction: ProjectPublishAction,
): string | null {
  if (!draft.title.trim()) return '请填写项目标题'
  if (publishAction === 'DRAFT') return null

  if (!descriptionContent.longtext.trim()) return '请填写项目需求说明'
  const resolvedSummary = resolvePublishSummary(draft.summary, descriptionContent.longtext)
  if (!resolvedSummary) return '请填写项目摘要，或确保需求说明含有可提取的文字内容'
  if (!draft.amount.trim()) return '请填写项目预算'
  if (draft.skillTags.length === 0) return '请至少添加 1 个技能标签'
  return null
}

// 03）提交发布项目（submitPublishProject）
export async function submitPublishProject(options: {
  draft: PublishProjectFormDraft
  descriptionContent: ContentLongtext
  projectUid?: ProjectResourceUid | null
  publishAction: ProjectPublishAction
}): Promise<{ projectUid: ProjectResourceUid }> {
  const validationError = validatePublishProjectSubmit(options.draft, options.descriptionContent, options.publishAction)
  if (validationError) throw new ProjectsApiError(400, validationError)

  const requestDraft: PublishProjectFormDraftForRequest = {
    title: options.draft.title,
    summary: options.draft.summary,
    channel: options.draft.channel,
    campusRecruitType: options.draft.campusRecruitType,
    amount: options.draft.amount,
    level: options.draft.level,
    duration: options.draft.duration,
    teamSize: options.draft.teamSize,
    skillTags: options.draft.skillTags,
    deadline: options.draft.deadline,
  }

  const payload = buildUpsertProjectRequest(requestDraft, options.descriptionContent.longtext, options.publishAction)

  const response = isProjectResourceUid(options.projectUid)
    ? await updateProject(options.projectUid, payload)
    : await createProject(payload)

  return { projectUid: response.uid }
}

export { ProjectsApiError }
