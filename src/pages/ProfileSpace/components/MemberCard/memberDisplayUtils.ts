import type { TeamResourceUid } from '../../../api/resourceUid'
import type { ProfileMemberItem } from '../types'

// 01）成员展示名称上下文（MemberDisplayNameContext）
export type MemberDisplayNameContext = 'manage' | 'public'

// 02）成员展示名称选项（ResolveMemberDisplayNameOptions）
export interface ResolveMemberDisplayNameOptions {
  context: MemberDisplayNameContext
  isLabSpace?: boolean
  isLoggedIn?: boolean
  isViewerTeamMember?: boolean
}

// 03）判断是否为实验室团队 uid（isLabTeamUid）
/**
 * 函数名：isLabTeamUid
 * 功能：根据 teamUid 前缀判断是否为公共实验室空间（LB 开头）。
 * 输入：
 * - teamUid：团队对外 uid
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function isLabTeamUid(teamUid: TeamResourceUid | string | null | undefined): boolean {
  return typeof teamUid === 'string' && teamUid.trim().toUpperCase().startsWith('LB')
}

// 04）解析成员展示名称（resolveMemberDisplayName）
/**
 * 函数名：resolveMemberDisplayName
 * 功能：按场景解析成员名称：管理表单用 realName；公共实验室对团队成员展示 realName，否则 nickname。
 * 实现方法：
 * - context=manage：优先 realName
 * - context=public 且实验室且登录且为团队成员：优先 realName
 * - 其余：nickname
 * 输入：
 * - member：含 nickname / realName 的成员项
 * - options：展示上下文与访客身份
 * 输出：
 * - 返回值：展示用名称字符串
 * - 副作用：无
 */
export function resolveMemberDisplayName(
  member: Pick<ProfileMemberItem, 'nickname' | 'realName'>,
  options: ResolveMemberDisplayNameOptions,
): string {
  const nickname = member.nickname.trim()
  const realName = member.realName?.trim() ?? ''

  if (options.context === 'manage') {
    return realName || nickname
  }

  if (options.isLabSpace && options.isLoggedIn && options.isViewerTeamMember) {
    return realName || nickname
  }

  return nickname
}

// 05）解析用户预览展示名称（resolvePublicPreviewDisplayName）
/**
 * 函数名：resolvePublicPreviewDisplayName
 * 功能：解析 public-preview 接口返回的名称，规则与 resolveMemberDisplayName 一致。
 * 输入：
 * - preview：含 nickname / realName 的预览对象
 * - options：展示上下文与访客身份
 * 输出：
 * - 返回值：展示用名称字符串
 * - 副作用：无
 */
export function resolvePublicPreviewDisplayName(
  preview: { nickname: string; realName?: string | null },
  options: ResolveMemberDisplayNameOptions & { isLabSpace: boolean },
): string {
  return resolveMemberDisplayName(
    {
      nickname: preview.nickname,
      realName: preview.realName ?? null,
    },
    options,
  )
}

// 06）判断当前用户是否为团队成员（resolveViewerIsTeamMember）
/**
 * 函数名：resolveViewerIsTeamMember
 * 功能：判断指定 uid 是否出现在团队成员列表中。
 * 输入：
 * - members：团队成员列表
 * - viewerUid：当前用户 uid
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function resolveViewerIsTeamMember(
  members: Pick<ProfileMemberItem, 'uid'>[],
  viewerUid: string | null | undefined,
): boolean {
  if (!viewerUid) {
    return false
  }

  return members.some((member) => member.uid === viewerUid)
}
