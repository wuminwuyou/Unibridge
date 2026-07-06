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
  contentDetail?: string,
): ProjectDetailPayload {
  return {
    title: draft.title.trim() || '未命名项目',
    summary: resolvePublishSummary(draft.summary, longtext) || '暂无摘要',
    channel: draft.channel,
    channelLabel: resolveProjectChannelLabel(draft.channel, draft.campusRecruitType),
    campusRecruitType: draft.campusRecruitType,
    description: longtext,
    descriptionEditorType: editorType,
    amountMin: draft.amountMin.trim() || '预算最小值待填写',
    amountMax: draft.amountMax.trim() || '预算最大值待填写',
    level: draft.level,
    duration: draft.duration.trim() || '未填写',
    skillTags: draft.skillTags,
    deadline: draft.deadline.trim() || '未填写',
    publishStatus,
    contentDetail: contentDetail?.trim() || undefined,
    updatedAt: new Date().toISOString(),
    owner: null,
  }
}
