// 01）项目详情 ViewModel 类型定义（projectDetailViewModel）
import type { ContentEditorType } from '@entities/editor/model/types'
import type { LevelCode } from '@shared/types/level'
import type { CampusRecruitType } from '@shared/types/project'

// 02）项目详情发布状态（ProjectDetailPublishStatus）
export type ProjectDetailPublishStatus = 'DRAFT' | 'PREVIEW' | 'PUBLISHED'

// 03）项目详情 API 加载状态（ProjectDetailApiLoadState）
export type ProjectDetailApiLoadState = 'idle' | 'loading' | 'error' | 'ready'

// 04）项目详情载荷（ProjectDetailPayload）
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

// 05）项目详情路由状态（ProjectDetailLocationState）
export interface ProjectDetailLocationState {
  payload?: ProjectDetailPayload
}
