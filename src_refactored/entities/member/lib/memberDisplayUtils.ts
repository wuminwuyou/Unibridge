import type { TeamResourceUid } from '../../../shared/api/resourceUid'
import type { ProfileMemberItem } from '../model'

export type MemberDisplayNameContext = 'manage' | 'public'

export interface ResolveMemberDisplayNameOptions {
  context: MemberDisplayNameContext
  isLabSpace?: boolean
  isLoggedIn?: boolean
  isViewerTeamMember?: boolean
}

// 01）判断是否为实验室团队 uid（isLabTeamUid）
export function isLabTeamUid(teamUid: TeamResourceUid | string | null | undefined): boolean {
  return typeof teamUid === 'string' && teamUid.trim().toUpperCase().startsWith('LB')
}

// 02）解析成员展示名称（resolveMemberDisplayName）
export function resolveMemberDisplayName(
  member: Pick<ProfileMemberItem, 'nickname' | 'realName'>,
  options: ResolveMemberDisplayNameOptions,
): string {
  const nickname = member.nickname.trim()
  const realName = member.realName?.trim() ?? ''
  if (options.context === 'manage') return realName || nickname
  if (options.isLabSpace && options.isLoggedIn && options.isViewerTeamMember) return realName || nickname
  return nickname
}

// 03）解析用户预览展示名称（resolvePublicPreviewDisplayName）
export function resolvePublicPreviewDisplayName(
  preview: { nickname: string; realName?: string | null },
  options: ResolveMemberDisplayNameOptions & { isLabSpace: boolean },
): string {
  return resolveMemberDisplayName({ nickname: preview.nickname, realName: preview.realName ?? null }, options)
}

// 04）判断当前用户是否为团队成员（resolveViewerIsTeamMember）
export function resolveViewerIsTeamMember(
  members: Pick<ProfileMemberItem, 'uid'>[],
  viewerUid: string | null | undefined,
): boolean {
  if (!viewerUid) return false
  return members.some((member) => member.uid === viewerUid)
}
