import type { OrgPublicMemberRole, ProfileOrgMemberItem } from '../types'

// 01）归一化机构公开展示 role（normalizeOrgPublicMemberRole）
/**
 * 函数名：normalizeOrgPublicMemberRole
 * 功能：将 user_auth_link.role 归一化为机构空间可展示的 PM | MENTOR；STUDENT 等返回 null。
 * 实现方法：
 * - PM → 员工
 * - MENTOR → 导师
 * - STUDENT 及其它 → null（不进入机构人员列表）
 * 输入：
 * - role：接口 role 字段
 * 输出：
 * - 返回值：OrgPublicMemberRole | null
 * - 副作用：无
 */
export function normalizeOrgPublicMemberRole(
  role: string | null | undefined,
): OrgPublicMemberRole | null {
  const normalizedRole = (role ?? '').trim().toUpperCase()
  if (normalizedRole === 'PM') {
    return 'PM'
  }

  if (normalizedRole === 'MENTOR') {
    return 'MENTOR'
  }

  return null
}

// 02）解析机构人员展示名称（resolveOrgMemberDisplayName）
/**
 * 函数名：resolveOrgMemberDisplayName
 * 功能：机构公共空间人员名称默认展示实名（公众人物），无实名时回退 nickname。
 * 输入：
 * - member：含 nickname / realName 的机构人员项
 * 输出：
 * - 返回值：展示用名称字符串
 * - 副作用：无
 */
export function resolveOrgMemberDisplayName(
  member: Pick<ProfileOrgMemberItem, 'nickname' | 'realName' | 'uid'>,
): string {
  const realName = member.realName?.trim() ?? ''
  const nickname = member.nickname.trim()
  return realName || nickname || member.uid
}

// 03）解析机构人员身份文案（resolveOrgMemberRoleLabel）
/**
 * 函数名：resolveOrgMemberRoleLabel
 * 功能：将机构公开展示 role 映射为卡片身份文案。
 * 输入：
 * - orgRole：PM | MENTOR
 * 输出：
 * - 返回值：中文身份标签
 * - 副作用：无
 */
export function resolveOrgMemberRoleLabel(orgRole: OrgPublicMemberRole): string {
  if (orgRole === 'PM') {
    return '员工'
  }

  return '导师'
}
