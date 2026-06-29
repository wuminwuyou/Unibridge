import type { ProfileMemberItem, TeamMemberRole } from '../model'

// 01）成员元信息展示片段（MemberMetaSegment）
export interface MemberMetaSegment {
  kind: 'owner' | 'admin' | 'identity' | 'career'
  label: string
}

// 02）归一化团队成员 role（normalizeTeamMemberRole）
export function normalizeTeamMemberRole(role: string | undefined): TeamMemberRole | null {
  const normalizedRole = role?.trim().toUpperCase()
  if (normalizedRole === 'LEADER' || normalizedRole === 'MEMBER' || normalizedRole === 'MENTOR') {
    return normalizedRole as TeamMemberRole
  }
  const legacyRole = role?.trim()
  if (legacyRole === '队长' || legacyRole === '负责人') return 'LEADER'
  if (legacyRole === '导师' || legacyRole === '指导老师') return 'MENTOR'
  return null
}

// 03）解析成员身份文案（resolveMemberIdentityLabel）
export function resolveMemberIdentityLabel(role: TeamMemberRole): string {
  return role === 'MENTOR' ? '导师' : '学生'
}

// 04）判断是否展示负责人标签（resolveMemberShowsOwnerBadge）
export function resolveMemberShowsOwnerBadge(member: ProfileMemberItem): boolean {
  return member.isOwner === true || member.role === 'LEADER'
}

// 05）判断是否展示管理员标签（resolveMemberShowsAdminBadge）
export function resolveMemberShowsAdminBadge(
  member: Pick<ProfileMemberItem, 'isAdmin' | 'isOwner'>,
): boolean {
  return member.isAdmin === true && member.isOwner !== true
}

// 06）构建成员卡片元信息片段（buildMemberMetaSegments）
export function buildMemberMetaSegments(member: ProfileMemberItem): MemberMetaSegment[] {
  const segments: MemberMetaSegment[] = []
  if (resolveMemberShowsOwnerBadge(member)) segments.push({ kind: 'owner', label: '负责人' })
  if (resolveMemberShowsAdminBadge(member)) segments.push({ kind: 'admin', label: '管理员' })
  segments.push({ kind: 'identity', label: resolveMemberIdentityLabel(member.role) })
  const careerLabel = member.career?.trim()
  if (careerLabel) segments.push({ kind: 'career', label: careerLabel })
  return segments
}

// 07）判断是否展示元信息分隔符（shouldShowMemberMetaSeparator）
export function shouldShowMemberMetaSeparator(segments: MemberMetaSegment[], index: number): boolean {
  if (index <= 0) return false
  const previousKind = segments[index - 1]?.kind
  return previousKind !== 'owner' && previousKind !== 'admin'
}

// 08）判断成员是否具备团队管理权限（resolveMemberCanManageTeam）
export function resolveMemberCanManageTeam(
  members: ProfileMemberItem[],
  userUid: string | null | undefined,
): boolean {
  if (!userUid) return false
  const currentMember = members.find((member) => member.uid === userUid)
  return currentMember?.isAdmin === true
}
