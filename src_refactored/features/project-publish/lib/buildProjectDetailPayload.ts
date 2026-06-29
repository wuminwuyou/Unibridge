// 01）由发布表单构建项目详情载荷（buildProjectDetailPayload）
import type { ContentEditorType } from '@entities/editor/model/types'
import type { LevelCode } from '@shared/types/level'
import type { CampusRecruitType } from '@shared/types/project'
import { resolvePublishSummary } from '@shared/lib/publishSummary'
import { resolveProjectChannelLabel } from '../constants/publishOptions'
import type { PublishProjectFormDraft } from '../model/types'

// 02）项目详情发布状态（ProjectDetailPublishStatus）
export type ProjectDetailPublishStatus = 'DRAFT' | 'PREVIEW' | 'PUBLISHED'

// 03）项目详情载荷（ProjectDetailPayload）
export interface ProjectDetailPayload {
  title: string
  summary: string
  channel: string
  channelLabel: string
  campusRecruitType?: CampusRecruitType | null
  description: string
  descriptionEditorType: ContentEditorType
  amount: string
  level: LevelCode
  duration: string
  teamSize: string
  skillTags: string[]
  deadline: string
  publishStatus: ProjectDetailPublishStatus
  updatedAt: string
}

// 04）项目详情路由状态（ProjectDetailLocationState）
export interface ProjectDetailLocationState {
  payload?: ProjectDetailPayload
}

// 05）buildProjectDetailPayload
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
  }
}
