// 01）团队成员变更快照与请求体构造（buildTeamMembersUpdatePayload）
import type {
  TeamMemberRole,
  TeamProfileMemberAdditionDto,
  TeamProfileMemberRemovalDto,
  TeamProfileMemberUpdateDto,
  UpdateTeamProfileMembersRequest,
} from '@entities/team/model/types'

// 02）可对比成员快照（TeamMemberChangeSnapshot）
export interface TeamMemberChangeSnapshot {
  uid: string
  role: TeamMemberRole
  career: string
  isAdmin: boolean
  isOwner?: boolean
}

// 03）构建团队成员批量更新请求体（buildTeamMembersUpdatePayload）
/**
 * 函数名：buildTeamMembersUpdatePayload
 * 功能：对比初始与当前成员列表，生成 PUT /team-profile/members 请求体。
 * 实现方法：
 * - updates：uid 仍存在且 career 或 isAdmin 变化
 * - additions：当前有、初始无的新成员（仅 MEMBER / MENTOR）
 * - removals：初始有、当前无且非负责人的成员
 * 输入：
 * - initialMembers：进入表单时的成员快照
 * - currentMembers：提交时的成员快照
 * 输出：
 * - 返回值：UpdateTeamProfileMembersRequest | null（无有效变更时 null）
 * - 副作用：无
 */
export function buildTeamMembersUpdatePayload(
  initialMembers: TeamMemberChangeSnapshot[],
  currentMembers: TeamMemberChangeSnapshot[],
): UpdateTeamProfileMembersRequest | null {
  const initialMemberMap = new Map(initialMembers.map((m) => [m.uid, m]))
  const currentMemberMap = new Map(currentMembers.map((m) => [m.uid, m]))

  const updates: TeamProfileMemberUpdateDto[] = []
  const additions: TeamProfileMemberAdditionDto[] = []
  const removals: TeamProfileMemberRemovalDto[] = []

  for (const member of currentMembers) {
    const initialMember = initialMemberMap.get(member.uid)
    if (!initialMember) {
      if (member.role === 'MEMBER' || member.role === 'MENTOR') {
        additions.push({
          uid: member.uid,
          role: member.role,
          career: member.career.trim(),
        })
      }
      continue
    }

    const initialCareer = initialMember.career.trim()
    const nextCareer = member.career.trim()
    const careerChanged = nextCareer !== initialCareer
    const adminChanged = member.isAdmin !== initialMember.isAdmin

    if (careerChanged || adminChanged) {
      updates.push({
        uid: member.uid,
        career: nextCareer,
        isAdmin: member.isAdmin,
      })
    }
  }

  for (const member of initialMembers) {
    if (currentMemberMap.has(member.uid) || member.isOwner) continue
    removals.push({ uid: member.uid })
  }

  if (updates.length === 0 && additions.length === 0 && removals.length === 0) return null

  return {
    ...(updates.length > 0 ? { updates } : {}),
    ...(additions.length > 0 ? { additions } : {}),
    ...(removals.length > 0 ? { removals } : {}),
  }
}
