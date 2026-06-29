// 01）发布项目 Feature 核心类型定义
import type { LevelCode } from '@shared/types/level'
import type { CampusRecruitType } from '@shared/types/project'

// 02）项目发布动作（ProjectPublishAction）
export type ProjectPublishAction = 'DRAFT' | 'PUBLISH'

// 03）发布项目表单草稿类型（PublishProjectFormDraft）
export interface PublishProjectFormDraft {
  title: string
  summary: string
  channel: string
  campusRecruitType: CampusRecruitType | null
  description: string
  amount: string
  level: LevelCode
  duration: string
  teamSize: string
  skillTags: string[]
  deadline: string
}

// 04）高校招募子类型选项（CampusRecruitOption）
export interface CampusRecruitOption {
  value: CampusRecruitType
  label: string
  description: string
}

// 05）发布渠道选项（PublishChannelOption）
export interface PublishChannelOption {
  value: string
  label: string
  description: string
}
