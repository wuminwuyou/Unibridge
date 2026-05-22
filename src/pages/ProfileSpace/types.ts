import type { LevelCode } from '../../types/level'

// 01）个人空间用户核心基础信息（含顶层 id + baseInfo 字段）
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

// 02）个人空间用户拓展统计信息，对应 API 中的 extendInfo
export interface UserExtendedProfile {
    notice: string
    ipLocation: string
    joinDate: string
    careerData: string[]
    skills: string[]
}

// 03）个人空间用户所属实验室/团队信息，对应 API 中的 associatedTeam
export interface UserLaboratoryProfile {
    laboratoryId: number | null
    laboratoryName: string | null
    laboratoryDescription: string | null
    laboratoryEntryPath: string | null
}