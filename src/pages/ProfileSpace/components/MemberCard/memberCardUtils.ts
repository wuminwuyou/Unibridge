import type { ProfileMemberItem, TeamMemberRole } from '../types'

// 01）成员元信息展示片段（MemberMetaSegment）
export interface MemberMetaSegment {
  kind: 'owner' | 'admin' | 'identity' | 'career'
  label: string
}

// 02）归一化团队成员 role（normalizeTeamMemberRole）
/**
 * 函数名：normalizeTeamMemberRole
 * 功能：将接口 role 归一化为 LEADER | MEMBER | MENTOR。
 * 输入：
 * - role：接口 role 字段
 * 输出：
 * - 返回值：TeamMemberRole | null
 * - 副作用：无
 */
export function normalizeTeamMemberRole(role: string | undefined): TeamMemberRole | null {
  const normalizedRole = role?.trim().toUpperCase()
  if (normalizedRole === 'LEADER' || normalizedRole === 'MEMBER' || normalizedRole === 'MENTOR') {
    return normalizedRole
  }

  const legacyRole = role?.trim()
  if (legacyRole === '队长' || legacyRole === '负责人') {
    return 'LEADER'
  }
  if (legacyRole === '导师' || legacyRole === '指导老师') {
    return 'MENTOR'
  }

  return null
}

// 03）解析成员身份文案（resolveMemberIdentityLabel）
/**
 * 函数名：resolveMemberIdentityLabel
 * 功能：LEADER/MEMBER 展示为「学生」，MENTOR 展示为「导师」。
 * 输入：
 * - role：TeamMemberRole
 * 输出：
 * - 返回值：「导师」或「学生」
 * - 副作用：无
 */
export function resolveMemberIdentityLabel(role: TeamMemberRole): string {
  return role === 'MENTOR' ? '导师' : '学生'
}

// 04）判断是否展示负责人标签（resolveMemberShowsOwnerBadge）
/**
 * 函数名：resolveMemberShowsOwnerBadge
 * 功能：isOwner 为 true 时展示科技蓝「负责人」标签（映射层将排序后 members[0] 标为 isOwner）。
 * 输入：
 * - member：ProfileMemberItem
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function resolveMemberShowsOwnerBadge(member: ProfileMemberItem): boolean {
  return member.isOwner === true || member.role === 'LEADER'
}

// 04.1）判断是否展示管理员标签（resolveMemberShowsAdminBadge）
/**
 * 函数名：resolveMemberShowsAdminBadge
 * 功能：协助管理员（isAdmin 且非负责人）展示绿色「管理员」标签。
 * 输入：
 * - member：ProfileMemberItem
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function resolveMemberShowsAdminBadge(
  member: Pick<ProfileMemberItem, 'isAdmin' | 'isOwner'>,
): boolean {
  return member.isAdmin === true && member.isOwner !== true
}

// 05）构建成员卡片元信息片段（buildMemberMetaSegments）
/**
 * 函数名：buildMemberMetaSegments
 * 功能：组装 MemberCard 次行展示：负责人 · 管理员 · 导师/学生 · career。
 * 实现方法：
 * - LEADER/MEMBER → 学生；MENTOR → 导师
 * - isOwner（含列表首位）→ 前置科技蓝「负责人」
 * - isAdmin 且非负责人 → 绿色「管理员」
 * - career 非空时追加团队定位文案
 * 输入：
 * - member：ProfileMemberItem
 * 输出：
 * - 返回值：MemberMetaSegment[]
 * - 副作用：无
 */
export function buildMemberMetaSegments(member: ProfileMemberItem): MemberMetaSegment[] {
  const segments: MemberMetaSegment[] = []

  if (resolveMemberShowsOwnerBadge(member)) {
    segments.push({ kind: 'owner', label: '负责人' })
  }

  if (resolveMemberShowsAdminBadge(member)) {
    segments.push({ kind: 'admin', label: '管理员' })
  }

  segments.push({
    kind: 'identity',
    label: resolveMemberIdentityLabel(member.role),
  })

  const careerLabel = member.career?.trim()
  if (careerLabel) {
    segments.push({ kind: 'career', label: careerLabel })
  }

  return segments
}

// 06）判断是否展示元信息分隔符（shouldShowMemberMetaSeparator）
/**
 * 函数名：shouldShowMemberMetaSeparator
 * 功能：负责人/管理员标签后不使用「·」，仅在其后的片段前展示分隔符。
 * 输入：
 * - segments：元信息片段列表
 * - index：当前片段下标
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function shouldShowMemberMetaSeparator(segments: MemberMetaSegment[], index: number): boolean {
  if (index <= 0) {
    return false
  }

  const previousKind = segments[index - 1]?.kind
  return previousKind !== 'owner' && previousKind !== 'admin'
}

// 07）判断成员是否具备团队管理权限（resolveMemberCanManageTeam）
/**
 * 函数名：resolveMemberCanManageTeam
 * 功能：根据成员 isAdmin 判断指定用户是否可进入团队管理入口（如管理成员）。
 * 实现方法：
 * - 在 members 中查找与 userUid 匹配的项
 * - 匹配项 isAdmin 为 true 时返回 true
 * 输入：
 * - members：团队成员列表
 * - userUid：当前登录用户对外 uid，可为空
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function resolveMemberCanManageTeam(
  members: ProfileMemberItem[],
  userUid: string | null | undefined,
): boolean {
  if (!userUid) {
    return false
  }

  const currentMember = members.find((member) => member.uid === userUid)
  return currentMember?.isAdmin === true
}
