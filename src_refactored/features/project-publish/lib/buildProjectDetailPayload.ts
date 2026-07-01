// 01）由发布表单构建项目详情载荷（buildProjectDetailPayload）
import type { ContentEditorType } from '@entities/editor/model/types'
import { resolvePublishSummary } from '@shared/lib/publishSummary'
import { resolveProjectChannelLabel } from '@entities/project'
import type { PublishProjectFormDraft } from '../model/types'
import type { ProjectDetailPublishStatus, ProjectDetailPayload } from '@entities/project'

// 02）buildProjectDetailPayload
export function buildProjectDetailPayload(
  draft: PublishProjectFormDraft,
  longtext: string,
  editorType: ContentEditorType,
  publishStatus: ProjectDetailPublishStatus,
): ProjectDetailPayload {
  return {
    title: draft.title.trim() || '未命名项目',
    summary: resolvePublishSummary(draft.summary, longtext) || '暂无摘要',
    channel: draft.channel,
    channelLabel: resolveProjectChannelLabel(draft.channel, draft.campusRecruitType),
    campusRecruitType: draft.campusRecruitType,
    description: longtext,
    descriptionEditorType: editorType,
    amount: draft.amount.trim() || '预算待填写',
    level: draft.level,
    duration: draft.duration.trim() || '未填写',
    teamSize: draft.teamSize.trim() || '未填写',
    skillTags: draft.skillTags,
    deadline: draft.deadline.trim() || '未填写',
    publishStatus,
    updatedAt: new Date().toISOString(),
    owner: null,
  }
}
