import type { LevelCode } from '../../../../types/level'
import type { personalViewTabs } from './personalViewPageData'

// 01）个人用户空间 Tab 类型（ProfileTab）
export type ProfileTab = (typeof personalViewTabs)[number]

// 02）个人用户核心基础信息（UserCoreProfile）
export interface UserCoreProfile {
  id: number
  nickname: string
  avatarUrl: string | null
  isVerified: boolean
  organizationName: string | null
  position: string
  bio: string
  level: LevelCode | null
}

// 03）个人用户拓展统计信息（UserExtendedProfile）
export interface UserExtendedProfile {
  notice: string
  ipLocation: string
  joinDate: string
  careerData: string[]
  skills: string[]
}

// 04）个人用户所属实验室/团队信息（UserLaboratoryProfile）
export interface UserLaboratoryProfile {
  laboratoryId: number | null
  laboratoryName: string | null
  laboratoryDescription: string | null
  laboratoryEntryPath: string | null
}
