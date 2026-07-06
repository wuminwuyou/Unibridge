// 01）项目详情 ViewModel 类型定义（projectDetailViewModel）
import type { ContentEditorType } from '@entities/editor/model/types'
import type { LevelCode } from '@shared/types/level'
import type { CampusRecruitType } from '@shared/types/project'

// 02）项目发布者信息（ProjectOwnerInfo）
/**
 * 项目发布者的身份信息，来源于 p_user_profile + p_tenant_org_profile 联表查询。
 */
export interface ProjectOwnerInfo {
  uid: string
  name: string
  avatarUrl: string | null
  careerData: unknown | null
  organization: string | null
  location: string | null
}

// 03）项目详情发布状态（ProjectDetailPublishStatus）
export type ProjectDetailPublishStatus = 'DRAFT' | 'PREVIEW' | 'PUBLISHED'

// 04）项目详情 API 加载状态（ProjectDetailApiLoadState）
export type ProjectDetailApiLoadState = 'idle' | 'loading' | 'error' | 'ready'

// 05）项目详情载荷（ProjectDetailPayload）
export interface ProjectDetailPayload {
  title: string
  summary: string
  channel: string
  channelLabel: string
  campusRecruitType?: CampusRecruitType | null
  description: string
  descriptionEditorType: ContentEditorType
  amountMin: string
  amountMax: string
  level: LevelCode
  duration: string
  skillTags: string[]
  deadline: string
  publishStatus: ProjectDetailPublishStatus
  contentDetail?: string
  updatedAt: string
  owner: ProjectOwnerInfo | null
}

// 06）项目详情路由状态（ProjectDetailLocationState）
export interface ProjectDetailLocationState {
  payload?: ProjectDetailPayload
}
