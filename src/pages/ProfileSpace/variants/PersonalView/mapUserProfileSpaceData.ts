import type { UserProfileSpaceData } from '../../../../api/userProfile'
import { normalizeUserResourceUid } from '../../../../api/resourceUid'
import type { LevelCode } from '../../../../types/level'
import type { UserAssociatedTeam, UserCoreProfile, UserExtendedProfile } from './types'

// 01）个人空间页壳视图模型类型（ProfileSpaceShellViewModel）
export interface ProfileSpaceShellViewModel {
  userCoreProfile: UserCoreProfile
  userExtendedProfile: UserExtendedProfile
  associatedTeams: UserAssociatedTeam[]
  activityHeatmap: number[]
  honors: unknown[]
}

// 02）归一化能力等级（normalizeLevelCode）
/**
 * 函数名：normalizeLevelCode
 * 功能：将服务端返回的等级字符串归一化为 LevelBadge 可识别的枚举值。
 * 实现方法：
 * - 去除空白并转大写
 * - 空值或无效值返回 null
 * - 命中白名单时返回对应 LevelCode
 * 输入：
 * - level：服务端等级字段
 * 输出：
 * - 返回值：LevelCode | null
 * - 副作用：无
 */
function normalizeLevelCode(level: string | null | undefined): LevelCode | null {
  const normalizedLevel = (level ?? '').trim().toUpperCase()
  if (!normalizedLevel || normalizedLevel === 'NULL' || normalizedLevel === 'UNDEFINED') {
    return null
  }
  const levelWhitelist: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']
  return levelWhitelist.includes(normalizedLevel as LevelCode) ? (normalizedLevel as LevelCode) : null
}

// 03）构建头像占位地址（buildAvatarFallbackUrl）
/**
 * 函数名：buildAvatarFallbackUrl
 * 功能：在接口未返回头像地址时生成基于昵称首字的占位头像 URL。
 * 实现方法：
 * - 取昵称首字符作为 seed
 * - 拼接 dicebear initials SVG 地址
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

// 04）映射个人空间页壳接口数据（mapUserProfileSpaceData）
/**
 * 函数名：mapUserProfileSpaceData
 * 功能：将 /user-profile/space 接口响应映射为 ProfileSpacePage 可直接渲染的视图模型。
 * 实现方法：
 * - 顶层 uid 与 baseInfo 映射为 userCoreProfile
 * - extendInfo 映射为 userExtendedProfile
 * - associatedTeam 数组映射为 associatedTeams
 * - 透传 honors 与 activityHeatmap
 * 输入：
 * - data：接口原始响应
 * 输出：
 * - 返回值：ProfileSpaceShellViewModel
 * - 副作用：无
 */
export function mapUserProfileSpaceData(data: UserProfileSpaceData): ProfileSpaceShellViewModel {
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
