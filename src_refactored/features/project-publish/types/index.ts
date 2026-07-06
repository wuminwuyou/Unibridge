// 01）发布项目 Feature 类型定义
import type { CampusRecruitType } from '../../../shared/types/project'

export type ProjectPublishAction = 'DRAFT' | 'PUBLISH'

export interface PublishProjectFormDraft {
  title: string; summary: string; channel: string
  campusRecruitType: CampusRecruitType | null
  amountMin: string; amountMax: string; level: string; duration: string
  skillTags: string[]; deadline: string; descriptionEditorType: string
}
