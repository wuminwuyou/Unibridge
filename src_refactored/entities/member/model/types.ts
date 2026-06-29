// 01）空间成员项类型定义（ProfileMemberItem）
import type { TeamResourceUid, UserResourceUid } from '../../../shared/api/resourceUid'
import type { LevelCode } from '../../../shared/types/level'

// 团队成员角色（TeamMemberRole）
export type TeamMemberRole = 'LEADER' | 'MEMBER' | 'MENTOR'

export interface ProfileMemberItem {
  uid: UserResourceUid
  nickname: string
  realName?: string | null
  role: TeamMemberRole
  career: string | null
  isOwner?: boolean
  isAdmin?: boolean
  avatarUrl: string | null
  level: LevelCode | null
}

export type { TeamResourceUid, UserResourceUid }

// 02）机构公开展示人员 role（OrgPublicMemberRole）
export type OrgPublicMemberRole = 'PM' | 'MENTOR' | 'COUNSELOR'

// 03）机构关联人员项（ProfileOrgMemberItem）
export interface ProfileOrgMemberItem {
  uid: UserResourceUid
  nickname: string
  realName?: string | null
  orgRole: OrgPublicMemberRole
  avatarUrl: string | null
  level: LevelCode | null
}
