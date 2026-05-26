import type {
  EntityProfileMemberDto,
  EntityProfileSpaceData,
  EntityProfileTeamPreviewDto,
  EntityProfileType,
} from '../../../../api/entityProfile/types'
import { normalizeUserResourceUid } from '../../../../api/resourceUid'
import type { LevelCode } from '../../../../types/level'
import { normalizeOrgPublicMemberRole } from '../../components/OrgMemberCard/orgMemberCardUtils'
import type { ProfileOrgMemberItem } from '../../components/types'
import { resolveEntitySupportsLabs } from './entityProfileUtils'
import type {
  OrganizationCoreProfile,
  OrganizationExtendedProfile,
  OrganizationInfoRow,
  OrganizationMemberItem,
  OrganizationTeamItem,
} from './types'

// 01）机构页壳视图模型（OrganizationSpaceShellViewModel）
export interface OrganizationSpaceShellViewModel {
  orgCoreProfile: OrganizationCoreProfile
  orgExtendedProfile: OrganizationExtendedProfile
  orgTeamsPreview: OrganizationTeamItem[]
  orgMembersPreview: OrganizationMemberItem[]
  orgInfoRows: OrganizationInfoRow[]
}

// 02）解析机构类型文案（resolveEntityTypeLabel）
/**
 * 函数名：resolveEntityTypeLabel
 * 功能：将 entity_profile.type 映射为中文展示文案。
 * 输入：
 * - type：ENTERPRISE | UNIVERSITY | string
 * 输出：
 * - 返回值：「企业」或「高校」
 * - 副作用：无
 */
export function resolveEntityTypeLabel(type: string | undefined): string {
  const normalizedType = type?.trim().toUpperCase()
  if (normalizedType === 'UNIVERSITY') {
    return '高校'
  }

  if (normalizedType === 'ENTERPRISE') {
    return '企业'
  }

  return '机构'
}

// 03）归一化机构类型（normalizeEntityProfileType）
function normalizeEntityProfileType(type: string | undefined): 'ENTERPRISE' | 'UNIVERSITY' {
  return type?.trim().toUpperCase() === 'UNIVERSITY' ? 'UNIVERSITY' : 'ENTERPRISE'
}

// 04）归一化能力等级（normalizeLevelCode）
function normalizeLevelCode(level: string | null | undefined): LevelCode | null {
  const normalizedLevel = (level ?? '').trim().toUpperCase()
  if (!normalizedLevel || normalizedLevel === 'NULL' || normalizedLevel === 'UNDEFINED') {
    return null
  }

  const levelWhitelist: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']
  return levelWhitelist.includes(normalizedLevel as LevelCode) ? (normalizedLevel as LevelCode) : null
}

// 05）映射机构人员 DTO（mapEntityProfileMember）
/**
 * 函数名：mapEntityProfileMember
 * 功能：将 user_auth_link 关联人员 DTO 映射为 ProfileOrgMemberItem；STUDENT 等非公开展示 role 返回 null。
 * 输入：
 * - member：接口人员对象
 * 输出：
 * - 返回值：ProfileOrgMemberItem | null
 * - 副作用：无
 */
export function mapEntityProfileMember(member: EntityProfileMemberDto): ProfileOrgMemberItem | null {
  const orgRole = normalizeOrgPublicMemberRole(member.role)
  if (!orgRole) {
    return null
  }

  const uid =
    normalizeUserResourceUid(member as unknown as Record<string, unknown>) ??
    member.uid ??
    member.userUid ??
    ''

  return {
    uid,
    nickname: member.nickname,
    realName: member.realName?.trim() || null,
    orgRole,
    avatarUrl: member.avatarUrl ?? null,
    level: normalizeLevelCode(member.level),
  }
}

// 06）映射机构人员列表（mapEntityProfileMembers）
/**
 * 函数名：mapEntityProfileMembers
 * 功能：批量映射机构人员，并过滤 role 为 STUDENT 等非 PM/MENTOR 的记录。
 * 输入：
 * - members：接口 members 数组
 * 输出：
 * - 返回值：ProfileOrgMemberItem[]
 * - 副作用：无
 */
export function mapEntityProfileMembers(
  members: EntityProfileMemberDto[] | undefined,
): ProfileOrgMemberItem[] {
  return (members ?? [])
    .map(mapEntityProfileMember)
    .filter((member): member is ProfileOrgMemberItem => member != null)
}

// 07）映射机构下属团队 DTO（mapEntityProfileTeamPreview）
/**
 * 函数名：mapEntityProfileTeamPreview
 * 功能：将机构下属团队预览 DTO 映射为 OrganizationTeamItem。
 * 输入：
 * - team：接口团队预览对象
 * 输出：
 * - 返回值：OrganizationTeamItem
 * - 副作用：无
 */
export function mapEntityProfileTeamPreview(team: EntityProfileTeamPreviewDto): OrganizationTeamItem {
  return {
    teamUid: team.teamUid,
    name: team.name,
    description: team.description?.trim() || null,
    logoUrl: team.logoUrl ?? null,
    memberCount: team.memberCount ?? 0,
  }
}

// 08）映射机构下属团队列表（mapEntityProfileTeams）
export function mapEntityProfileTeams(
  teams: EntityProfileTeamPreviewDto[] | undefined,
): OrganizationTeamItem[] {
  return (teams ?? []).map(mapEntityProfileTeamPreview)
}

// 09）构建默认信息表格行（buildDefaultOrganizationInfoRows）
function buildDefaultOrganizationInfoRows(
  coreProfile: EntityProfileSpaceData['coreProfile'],
  typeLabel: string,
  supportsLabs: boolean,
  memberCount: number,
): OrganizationInfoRow[] {
  const rows: OrganizationInfoRow[] = [
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

// 10）映射机构空间页壳数据（mapEntityProfileSpaceData）
/**
 * 函数名：mapEntityProfileSpaceData
 * 功能：将 GET /entity-profile/space 响应映射为 OrganizationView 页壳视图模型。
 * 输入：
 * - data：接口原始响应
 * 输出：
 * - 返回值：OrganizationSpaceShellViewModel
 * - 副作用：无
 */
export function mapEntityProfileSpaceData(data: EntityProfileSpaceData): OrganizationSpaceShellViewModel {
  const { coreProfile, extendedProfile, teamsPreview, membersPreview, infoRows } = data
  const normalizedType = normalizeEntityProfileType(coreProfile.type as EntityProfileType)
  const typeLabel = resolveEntityTypeLabel(coreProfile.type)
  const supportsLabs = resolveEntitySupportsLabs(coreProfile.entityCode)
  const orgMembersPreview = mapEntityProfileMembers(membersPreview)
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
    orgTeamsPreview: supportsLabs ? mapEntityProfileTeams(teamsPreview) : [],
    orgMembersPreview,
    orgInfoRows:
      infoRows && infoRows.length > 0
        ? infoRows.map((row) => ({ label: row.label, value: row.value }))
        : buildDefaultOrganizationInfoRows(coreProfile, typeLabel, supportsLabs, memberCount),
  }
}
