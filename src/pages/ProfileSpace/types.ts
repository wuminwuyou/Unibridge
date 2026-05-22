import type { LevelCode } from '../../types/level'
import type { profileTabs } from './profileSpacePageData'

// 01）个人空间 Tab 类型（ProfileTab）
export type ProfileTab = (typeof profileTabs)[number]

// 02）个人空间页壳加载状态（ProfileSpaceShellLoadState）
export type ProfileSpaceShellLoadState = 'loading' | 'error' | 'ready'

// 03）个人空间用户核心基础信息（含顶层 id + baseInfo 字段）
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

// 04）个人空间用户拓展统计信息，对应 API 中的 extendInfo
export interface UserExtendedProfile {
    notice: string
    ipLocation: string
    joinDate: string
    careerData: string[]
    skills: string[]
}

// 05）个人空间用户所属实验室/团队信息，对应 API 中的 associatedTeam
export interface UserLaboratoryProfile {
    laboratoryId: number | null
    laboratoryName: string | null
    laboratoryDescription: string | null
    laboratoryEntryPath: string | null
}