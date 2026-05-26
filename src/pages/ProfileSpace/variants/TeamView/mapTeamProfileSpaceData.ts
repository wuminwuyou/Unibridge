import type { TeamProfileMemberDto, TeamProfileSpaceData } from '../../../../api/teamProfile'
import { normalizeUserResourceUid } from '../../../../api/resourceUid'
import { normalizeTeamMemberRole } from '../../components/MemberCard/memberCardUtils'
import type { LevelCode } from '../../../../types/level'
import type {
  TeamCoreProfile,
  TeamExtendedProfile,
  TeamInfoRow,
  TeamMemberItem,
} from './types'

// 01）团队页壳视图模型（TeamSpaceShellViewModel）
export interface TeamSpaceShellViewModel {
  teamCoreProfile: TeamCoreProfile
  teamExtendedProfile: TeamExtendedProfile
  teamMembers: TeamMemberItem[]
  teamInfoRows: TeamInfoRow[]
}

// 02）归一化能力等级（normalizeLevelCode）
/**
 * 函数名：normalizeLevelCode
 * 功能：将服务端返回的等级字符串归一化为 LevelBadge 可识别的枚举值。
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

// 03）映射团队成员 DTO（mapTeamProfileMember）
/**
 * 函数名：mapTeamProfileMember
 * 功能：将团队成员 DTO 映射为 TeamMemberItem，并归一化 uid / level。
 * 输入：
 * - member：接口成员对象
 * - memberIndex：在 members 数组中的下标；接口已按负责人优先排序，下标 0 视为负责人
 * 输出：
 * - 返回值：TeamMemberItem
 * - 副作用：无
 */
export function mapTeamProfileMember(member: TeamProfileMemberDto, memberIndex?: number): TeamMemberItem {
  const uid =
    normalizeUserResourceUid(member as unknown as Record<string, unknown>) ?? member.uid ?? ''
  const normalizedRole = normalizeTeamMemberRole(member.role) ?? 'MEMBER'
  const realNameRaw = member.realName ?? (member as unknown as Record<string, unknown>).real_name
  const realName =
    typeof realNameRaw === 'string' && realNameRaw.trim().length > 0 ? realNameRaw.trim() : null

  return {
    uid,
    nickname: member.nickname,
    realName,
    role: normalizedRole,
    career: member.career?.trim() || null,
    isOwner: memberIndex === 0 || member.isOwner === true || normalizedRole === 'LEADER',
    isAdmin: member.isAdmin === true || memberIndex === 0 || member.isOwner === true,
    avatarUrl: member.avatarUrl,
    level: normalizeLevelCode(member.level),
  }
}

// 03.1）映射团队成员列表（mapTeamProfileMembers）
/**
 * 函数名：mapTeamProfileMembers
 * 功能：批量映射团队成员，并将排序后的首位成员标记为负责人。
 * 输入：
 * - members：接口 members 数组（已按 owner → 导师 → 学生 排序）
 * 输出：
 * - 返回值：TeamMemberItem[]
 * - 副作用：无
 */
export function mapTeamProfileMembers(members: TeamProfileMemberDto[] | undefined): TeamMemberItem[] {
  return (members ?? []).map((member, index) => mapTeamProfileMember(member, index))
}

// 04）映射团队空间页壳数据（mapTeamProfileSpaceData）
/**
 * 函数名：mapTeamProfileSpaceData
 * 功能：将 GET /team-profile/space 响应映射为 TeamView 页壳视图模型。
 * 输入：
 * - data：接口原始响应
 * 输出：
 * - 返回值：TeamSpaceShellViewModel
 * - 副作用：无
 */
export function mapTeamProfileSpaceData(data: TeamProfileSpaceData): TeamSpaceShellViewModel {
  const { coreProfile, extendedProfile, members, infoRows } = data

  return {
    teamCoreProfile: {
      teamUid: coreProfile.teamUid,
      name: coreProfile.name,
      description: coreProfile.description,
      organizationName: coreProfile.organizationName,
      logoUrl: coreProfile.logoUrl,
      memberCount: coreProfile.memberCount,
      foundedAt: coreProfile.foundedAt,
    },
    teamExtendedProfile: {
      notice: extendedProfile.notice,
      researchDirection: extendedProfile.researchDirection,
      contactEmail: extendedProfile.contactEmail,
    },
    teamMembers: mapTeamProfileMembers(members),
    teamInfoRows: (infoRows ?? []).map((row) => ({
      label: row.label,
      value: row.value,
    })),
  }
}
