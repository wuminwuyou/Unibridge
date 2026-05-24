import type { CampusRecruitType, PublishProjectFormDraft } from '../../pages/PublishProject/publishProjectPageData'
import type { ProjectResourceUid } from '../resourceUid'

// 01）项目发布动作（ProjectPublishAction）
export type ProjectPublishAction = 'DRAFT' | 'PUBLISH'

// 02）创建/更新项目请求体（UpsertProjectRequest）
export interface UpsertProjectRequest {
  publishAction: ProjectPublishAction
  title: string
  summary: string
  channel: string
  campusRecruitType: string | null
  description: string
  amount: string
  level: string
  duration: string
  teamSize: string
  skillTags: string[]
  deadline: string
}

// 03）项目写操作响应（UpsertProjectResponse）
export interface UpsertProjectResponse {
  uid: ProjectResourceUid
  publishAction: ProjectPublishAction
  status: 'DRAFT' | 'OPEN' | 'ONGOING' | 'CLOSED'
  category: string
  recruitmentType: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// 04）项目详情响应 DTO（ProjectDetailDto）
export interface ProjectDetailDto {
  uid: ProjectResourceUid
  title: string
  summary: string
  channel: string
  campusRecruitType: CampusRecruitType | null
  description: string
  descriptionEditorType: 'MARKDOWN' | 'RICHTEXT'
  amount: string | null
  level: string
  duration: string | null
  teamSize: string | null
  skillTags: string[]
  deadline: string | null
  status: 'DRAFT' | 'OPEN' | 'ONGOING' | 'CLOSED'
  publishedAt: string | null
  updatedAt: string
}

// 05）由表单草稿构建项目请求体（buildUpsertProjectRequest）
/**
 * 函数名：buildUpsertProjectRequest
 * 功能：将发布项目表单草稿转为 POST/PUT /projects 请求体。
 */
export function buildUpsertProjectRequest(
  draft: PublishProjectFormDraft,
  description: string,
  publishAction: ProjectPublishAction,
): UpsertProjectRequest {
  return {
    publishAction,
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    channel: draft.channel,
    campusRecruitType: draft.channel === 'campus' ? draft.campusRecruitType : null,
    description,
    amount: draft.amount.trim(),
    level: draft.level,
    duration: draft.duration.trim(),
    teamSize: draft.teamSize.trim(),
    skillTags: draft.skillTags,
    deadline: draft.deadline.trim(),
  }
}
