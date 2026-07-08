// 01）团队空间页壳视图模型与映射工具（mapTeamProfileSpaceData）
import { normalizeUserResourceUid, type TeamResourceUid } from '@shared/api/resourceUid'
import type { LevelCode } from '@shared/types/level'
import { normalizeLevel } from '@shared/lib/levelConstants'
import { normalizeTeamMemberRole } from '@entities/member/lib/memberCardUtils'
import type { ProfileMemberItem } from '@entities/member/model'
import type {
  TeamProfileMemberDto, TeamProfileSpaceData,
} from '../model/types'

// 02）团队核心档案视图模型（TeamProfileCoreVm）
export interface TeamProfileCoreVm {
  teamUid: TeamResourceUid
  name: string
  description: string
  organizationName: string | null
  logoUrl: string | null
  memberCount: number
  foundedAt: string
}

// 03）团队扩展档案视图模型（TeamProfileExtendedVm）
export interface TeamProfileExtendedVm {
  notice: string
  researchDirection: string
  contactEmail: string | null
}

// 04）团队信息行（TeamProfileInfoRowVm）
export interface TeamProfileInfoRowVm {
  label: string
  value: string
}

// 05）团队空间页壳视图模型（TeamProfileSpaceViewModel）
export interface TeamProfileSpaceViewModel {
  teamCoreProfile: TeamProfileCoreVm
  teamExtendedProfile: TeamProfileExtendedVm
  teamMembers: ProfileMemberItem[]
  teamInfoRows: TeamProfileInfoRowVm[]
}

// 06）归一化能力等级（normalizeLevelCode）— 委托 shared 统一实现
function normalizeLevelCode(level: string | null | undefined): LevelCode | null {
  return normalizeLevel(level, null)
}

// 07）映射团队成员 DTO 单项（mapTeamProfileMember）
/**
 * 函数名：mapTeamProfileMember
 * 功能：将团队成员 DTO 映射为 ProfileMemberItem，归一化 uid / level / 负责人标记。
 * 输入：
 * - member：接口成员对象
 * - memberIndex：在 members 数组中的下标；接口已按负责人优先排序，下标 0 视为负责人
 * 输出：
 * - 返回值：ProfileMemberItem
 * - 副作用：无
 */
export function mapTeamProfileMember(member: TeamProfileMemberDto, memberIndex?: number): ProfileMemberItem {
  const uid =
    normalizeUserResourceUid(member as unknown as Record<string, unknown>) ?? member.uid ?? ''
  const normalizedRole = normalizeTeamMemberRole(member.role) ?? 'MEMBER'
  const realNameRaw =
    member.realName ?? (member as unknown as Record<string, unknown>).real_name
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

// 08）批量映射成员（mapTeamProfileMembers）
export function mapTeamProfileMembers(members: TeamProfileMemberDto[] | undefined): ProfileMemberItem[] {
  return (members ?? []).map((member, index) => mapTeamProfileMember(member, index))
}

// 09）团队 Logo 占位（buildTeamLogoFallbackUrl）
export function buildTeamLogoFallbackUrl(name: string): string {
  const seed = encodeURIComponent(name.trim().slice(0, 2) || 'TM')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=cbd5e1&color=ffffff`
}

// 10）映射团队空间页壳数据（mapTeamProfileSpaceData）
/**
 * 函数名：mapTeamProfileSpaceData
 * 功能：将 GET /team-profile/space 响应映射为 TeamSpaceWidget 页壳视图模型。
 * 输入：
 * - data：接口原始响应
 * 输出：
 * - 返回值：TeamProfileSpaceViewModel
 * - 副作用：无
 */
export function mapTeamProfileSpaceData(data: TeamProfileSpaceData): TeamProfileSpaceViewModel {
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
    teamInfoRows: (infoRows ?? []).map((row) => ({ label: row.label, value: row.value })),
  }
}
