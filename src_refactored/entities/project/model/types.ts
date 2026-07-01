import type { ProjectResourceUid } from '../../../shared/api/resourceUid'

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
  campusRecruitType: string | null
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
  /** 发布者身份信息（新增，可能为 null 兼容过渡期） */
  owner?: {
    uid: string
    name: string
    avatarUrl: string | null
    careerData: unknown | null
    organization: string | null
    location: string | null
  } | null
}
