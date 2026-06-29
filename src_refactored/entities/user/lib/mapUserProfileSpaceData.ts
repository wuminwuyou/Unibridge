// 01）个人空间页壳视图模型与映射工具（mapUserProfileSpaceData）
import { normalizeUserResourceUid, type UserResourceUid } from '@shared/api/resourceUid'
import type { LevelCode } from '@shared/types/level'
import type {
  UserProfileSpaceAssociatedTeam, UserProfileSpaceData,
} from '../model/userProfileTypes'

// 02）个人空间核心档案（UserProfileCoreProfile）
export interface UserProfileCoreProfile {
  uid: UserResourceUid
  nickname: string
  avatarUrl: string | null
  isVerified: boolean
  organizationName: string | null
  position: string
  bio: string
  level: LevelCode | null
}

// 03）个人空间扩展档案（UserProfileExtendedProfile）
export interface UserProfileExtendedProfile {
  notice: string
  ipLocation: string
  joinDate: string
  careerData: string[]
  skills: string[]
}

// 04）个人空间页壳视图模型（UserProfileSpaceViewModel）
export interface UserProfileSpaceViewModel {
  userCoreProfile: UserProfileCoreProfile
  userExtendedProfile: UserProfileExtendedProfile
  associatedTeams: UserProfileSpaceAssociatedTeam[]
  activityHeatmap: number[]
  honors: unknown[]
}

// 05）归一化能力等级（normalizeLevelCode）
function normalizeLevelCode(level: string | null | undefined): LevelCode | null {
  const normalized = (level ?? '').trim().toUpperCase()
  if (!normalized || normalized === 'NULL' || normalized === 'UNDEFINED') return null
  const whitelist: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']
  return whitelist.includes(normalized as LevelCode) ? (normalized as LevelCode) : null
}

// 06）头像占位地址（buildAvatarFallbackUrl）
/**
 * 函数名：buildAvatarFallbackUrl
 * 功能：接口未返回头像时生成基于昵称首字的占位头像 URL。
 * 输入：
 * - nickname：用户昵称
 * 输出：
 * - 返回值：占位头像 URL
 * - 副作用：无
 */
export function buildAvatarFallbackUrl(nickname: string): string {
  const seed = encodeURIComponent(nickname.trim().slice(0, 1) || 'U')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=cbd5e1&color=ffffff`
}

// 07）映射个人空间页壳接口数据（mapUserProfileSpaceData）
/**
 * 函数名：mapUserProfileSpaceData
 * 功能：将 /user-profile/space 接口响应映射为大部件可直接渲染的视图模型。
 * 实现方法：
 * - 解析顶层 uid 与 baseInfo
 * - extendInfo 投影到 userExtendedProfile
 * - associatedTeam 透传
 * 输入：
 * - data：接口原始响应
 * 输出：
 * - 返回值：UserProfileSpaceViewModel
 * - 副作用：无
 */
export function mapUserProfileSpaceData(data: UserProfileSpaceData): UserProfileSpaceViewModel {
  const { baseInfo, extendInfo, associatedTeam } = data
  const uid =
    normalizeUserResourceUid(data as unknown as Record<string, unknown>) ??
    normalizeUserResourceUid(baseInfo as unknown as Record<string, unknown>) ??
    data.uid ??
    baseInfo.uid ??
    ''

  return {
    userCoreProfile: {
      uid,
      nickname: baseInfo.nickname,
      avatarUrl: baseInfo.avatarUrl,
      isVerified: baseInfo.isVerified,
      organizationName: baseInfo.organization,
      position: baseInfo.position ?? '',
      bio: baseInfo.bio,
      level: normalizeLevelCode(baseInfo.level),
    },
    userExtendedProfile: {
      notice: extendInfo.notice,
      ipLocation: extendInfo.ipLocation,
      joinDate: extendInfo.joinDate,
      careerData: extendInfo.careerData ?? [],
      skills: extendInfo.skills ?? [],
    },
    associatedTeams: (associatedTeam ?? []).map((team) => ({
      teamUid: team.teamUid,
      name: team.name,
      description: team.description,
      entryPath: team.entryPath,
    })),
    activityHeatmap: data.activityHeatmap ?? [],
    honors: data.honors ?? [],
  }
}
