// 01）机构空间页壳视图模型与映射工具（mapEntityProfileSpaceData）
import { normalizeUserResourceUid, type EntityCode } from '@shared/api/resourceUid'
import type { LevelCode } from '@shared/types/level'
import { normalizeOrgPublicMemberRole } from '@entities/member/lib/orgMemberCardUtils'
import type { ProfileOrgMemberItem } from '@entities/member/model'
import type {
  EntityProfileMemberDto, EntityProfileSpaceData,
  EntityProfileTeamPreviewDto, EntityProfileType,
} from '../model/types'
import { resolveEntitySupportsLabs } from './entityProfileUtils'

// 02）机构核心档案视图模型（OrganizationProfileCoreVm）
export interface OrganizationProfileCoreVm {
  entityCode: EntityCode
  name: string
  intro: string
  location: string
  type: 'UNIVERSITY' | 'ENTERPRISE'
  typeLabel: string
  logoUrl: string | null
  bannerUrl: string | null
  teamCount: number
  memberCount: number
  supportsLabs: boolean
}

// 03）机构扩展档案视图模型（OrganizationProfileExtendedVm）
export interface OrganizationProfileExtendedVm {
  announcement: string
}

// 04）机构信息行（OrganizationProfileInfoRowVm）
export interface OrganizationProfileInfoRowVm {
  label: string
  value: string
}

// 05）机构下属团队/实验室预览（OrganizationProfileTeamItemVm）
export interface OrganizationProfileTeamItemVm {
  teamUid: string
  name: string
  description: string | null
  logoUrl: string | null
  memberCount: number
  leaderUid: string | null
  leaderDisplayName: string | null
}

// 06）机构空间页壳视图模型（OrganizationSpaceViewModel）
export interface OrganizationSpaceViewModel {
  orgCoreProfile: OrganizationProfileCoreVm
  orgExtendedProfile: OrganizationProfileExtendedVm
  orgInfoRows: OrganizationProfileInfoRowVm[]
  orgMembersPreview: ProfileOrgMemberItem[]
  orgTeamsPreview: OrganizationProfileTeamItemVm[]
}

// 07）解析机构类型文案（resolveEntityTypeLabel）
export function resolveEntityTypeLabel(type: string | undefined): string {
  const normalized = type?.trim().toUpperCase()
  if (normalized === 'UNIVERSITY') return '高校'
  if (normalized === 'ENTERPRISE') return '企业'
  return '机构'
}

// 08）归一化机构类型（normalizeEntityProfileType）
function normalizeEntityProfileType(type: string | undefined): 'ENTERPRISE' | 'UNIVERSITY' {
  return type?.trim().toUpperCase() === 'UNIVERSITY' ? 'UNIVERSITY' : 'ENTERPRISE'
}

// 09）归一化能力等级（normalizeLevelCode）
function normalizeLevelCode(level: string | null | undefined): LevelCode | null {
  const normalized = (level ?? '').trim().toUpperCase()
  if (!normalized || normalized === 'NULL' || normalized === 'UNDEFINED') return null
  const whitelist: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']
  return whitelist.includes(normalized as LevelCode) ? (normalized as LevelCode) : null
}

// 10）映射机构人员 DTO 单项（mapEntityProfileMember）
export function mapEntityProfileMember(member: EntityProfileMemberDto): ProfileOrgMemberItem | null {
  const orgRole = normalizeOrgPublicMemberRole(member.role)
  if (!orgRole) return null
  const uid =
    normalizeUserResourceUid(member as unknown as Record<string, unknown>) ??
    member.uid ?? member.userUid ?? ''

  return {
    uid,
    nickname: member.nickname,
    realName: member.realName?.trim() || null,
    orgRole,
    avatarUrl: member.avatarUrl ?? null,
    level: normalizeLevelCode(member.level),
  }
}

// 11）批量映射机构人员（mapEntityProfileMembers）
export function mapEntityProfileMembers(
  members: EntityProfileMemberDto[] | undefined,
): ProfileOrgMemberItem[] {
  return (members ?? [])
    .map(mapEntityProfileMember)
    .filter((m): m is ProfileOrgMemberItem => m != null)
}

// 12）映射机构下属团队预览（mapEntityProfileTeamPreview）
export function mapEntityProfileTeamPreview(team: EntityProfileTeamPreviewDto): OrganizationProfileTeamItemVm {
  return {
    teamUid: team.teamUid,
    name: team.name,
    description: team.description?.trim() || null,
    logoUrl: team.logoUrl ?? null,
    memberCount: team.memberCount ?? 0,
    leaderUid: team.leaderUid ?? null,
    leaderDisplayName: team.leaderDisplayName ?? null,
  }
}

// 13）批量映射机构下属团队（mapEntityProfileTeams）
export function mapEntityProfileTeams(
  teams: EntityProfileTeamPreviewDto[] | undefined,
): OrganizationProfileTeamItemVm[] {
  return (teams ?? []).map(mapEntityProfileTeamPreview)
}

// 14）默认信息行（buildDefaultOrganizationInfoRows）
function buildDefaultOrganizationInfoRows(
  coreProfile: EntityProfileSpaceData['coreProfile'],
  typeLabel: string,
  supportsLabs: boolean,
  memberCount: number,
): OrganizationProfileInfoRowVm[] {
  const rows: OrganizationProfileInfoRowVm[] = [
    { label: '主体代码', value: coreProfile.entityCode },
    { label: '所在地', value: coreProfile.location || '未知' },
    { label: '主体类型', value: typeLabel },
  ]
  if (supportsLabs) {
    rows.push({ label: '实验室数量', value: `${coreProfile.teamCount ?? 0} 个` })
  }
  rows.push({ label: '关联人员', value: `${memberCount} 人` })
  return rows
}

// 15）机构 Logo 占位（buildOrganizationLogoFallbackUrl）
export function buildOrganizationLogoFallbackUrl(name: string): string {
  const seed = encodeURIComponent(name.trim().slice(0, 2) || 'EC')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=cbd5e1&color=ffffff`
}

// 16）映射机构空间页壳数据（mapEntityProfileSpaceData）
/**
 * 函数名：mapEntityProfileSpaceData
 * 功能：将 GET /entity-profile/space 响应映射为 OrganizationSpaceWidget 视图模型。
 * 实现方法：
 * - 类型标签化（企业/高校）
 * - 计算 supportsLabs（高校才显示实验室 Tab）
 * - 缺省 infoRows 时按字段构造默认行
 * 输入：
 * - data：接口原始响应
 * 输出：
 * - 返回值：OrganizationSpaceViewModel
 * - 副作用：无
 */
export function mapEntityProfileSpaceData(data: EntityProfileSpaceData): OrganizationSpaceViewModel {
  const { coreProfile, extendedProfile, teamsPreview, membersPreview, infoRows } = data
  const normalizedType = normalizeEntityProfileType(coreProfile.type as EntityProfileType)
  const typeLabel = resolveEntityTypeLabel(coreProfile.type)
  const supportsLabs = resolveEntitySupportsLabs(coreProfile.entityCode)
  const orgMembersPreview = mapEntityProfileMembers(membersPreview)
  const orgTeamsPreview = mapEntityProfileTeams(teamsPreview)
  const memberCount = orgMembersPreview.length

  return {
    orgCoreProfile: {
      entityCode: coreProfile.entityCode,
      name: coreProfile.name,
      intro: coreProfile.intro ?? '',
      location: coreProfile.location ?? '',
      type: normalizedType,
      typeLabel,
      logoUrl: coreProfile.logoUrl ?? null,
      bannerUrl: coreProfile.bannerUrl ?? null,
      teamCount: coreProfile.teamCount ?? teamsPreview?.length ?? 0,
      memberCount,
      supportsLabs,
    },
    orgExtendedProfile: {
      announcement: extendedProfile.announcement ?? '',
    },
    orgInfoRows:
      infoRows && infoRows.length > 0
        ? infoRows.map((row) => ({ label: row.label, value: row.value }))
        : buildDefaultOrganizationInfoRows(coreProfile, typeLabel, supportsLabs, memberCount),
    orgMembersPreview,
    orgTeamsPreview,
  }
}
