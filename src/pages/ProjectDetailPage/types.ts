import type { ContentEditorType } from '../../components/Reader'
import type { CampusRecruitType } from '../PublishProject/publishProjectPageData'
import type { LevelCode } from '../../types/level'

// 01）项目详情发布状态（ProjectDetailPublishStatus）
export type ProjectDetailPublishStatus = 'DRAFT' | 'PREVIEW' | 'PUBLISHED'

// 02）项目详情载荷（ProjectDetailPayload）
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

// 03）项目详情路由状态（ProjectDetailLocationState）
export interface ProjectDetailLocationState {
  payload?: ProjectDetailPayload
}
