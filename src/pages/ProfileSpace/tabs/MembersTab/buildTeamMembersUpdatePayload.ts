import type {
  TeamProfileMemberAdditionDto,
  TeamProfileMemberRemovalDto,
  TeamProfileMemberUpdateDto,
  UpdateTeamProfileMembersRequest,
} from '../../../api/teamProfile/types'
import type { TeamMemberRole } from '../../../api/teamProfile/types'

// 01）可对比成员快照（TeamMemberChangeSnapshot）
export interface TeamMemberChangeSnapshot {
  uid: string
  role: TeamMemberRole
  career: string
  isAdmin: boolean
  isOwner?: boolean
}

// 02）构建团队成员批量更新请求体（buildTeamMembersUpdatePayload）
/**
 * 函数名：buildTeamMembersUpdatePayload
 * 功能：对比初始与当前成员列表，生成 PUT /team-profile/members 请求体。
 * 实现方法：
 * - updates：uid 仍存在且 career 或 isAdmin 变化
 * - additions：当前有、初始无的新成员
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
  const initialMemberMap = new Map(initialMembers.map((member) => [member.uid, member]))
  const currentMemberMap = new Map(currentMembers.map((member) => [member.uid, member]))

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
    if (currentMemberMap.has(member.uid) || member.isOwner) {
      continue
    }

    removals.push({ uid: member.uid })
  }

  if (updates.length === 0 && additions.length === 0 && removals.length === 0) {
    return null
  }

  return {
    ...(updates.length > 0 ? { updates } : {}),
    ...(additions.length > 0 ? { additions } : {}),
    ...(removals.length > 0 ? { removals } : {}),
  }
}
