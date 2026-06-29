// 01）机构人员展示工具（entities/member/lib/orgMemberCardUtils）
import type { OrgPublicMemberRole, ProfileOrgMemberItem } from '../model'

// 02）归一化机构公开展示 role（normalizeOrgPublicMemberRole）
/**
 * 函数名：normalizeOrgPublicMemberRole
 * 功能：将 user_auth_link.role 归一化为机构空间可展示的 PM | MENTOR | COUNSELOR；STUDENT 等返回 null。
 * 输入：
 * - role：接口 role 字段
 * 输出：
 * - 返回值：OrgPublicMemberRole | null
 * - 副作用：无
 */
export function normalizeOrgPublicMemberRole(
  role: string | null | undefined,
): OrgPublicMemberRole | null {
  const normalized = (role ?? '').trim().toUpperCase()
  if (normalized === 'PM') return 'PM'
  if (normalized === 'MENTOR') return 'MENTOR'
  if (normalized === 'COUNSELOR') return 'COUNSELOR'
  return null
}

// 03）解析机构人员展示名称（resolveOrgMemberDisplayName）
export function resolveOrgMemberDisplayName(
  member: Pick<ProfileOrgMemberItem, 'nickname' | 'realName' | 'uid'>,
): string {
  const realName = member.realName?.trim() ?? ''
  const nickname = member.nickname.trim()
  return realName || nickname || member.uid
}

// 04）解析机构人员身份文案（resolveOrgMemberRoleLabel）
export function resolveOrgMemberRoleLabel(orgRole: OrgPublicMemberRole): string {
  if (orgRole === 'PM') return '员工'
  if (orgRole === 'MENTOR') return '导师'
  return '辅导员'
}
