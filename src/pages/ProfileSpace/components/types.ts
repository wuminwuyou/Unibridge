// 01）个人空间笔记类型定义（ProfileNoteItem）
import type { TeamMemberRole } from '../../../api/teamProfile/types'
import type { NoteResourceUid, UserResourceUid } from '../../../api/resourceUid'
import type { LevelCode } from '../../../types/level'

export interface ProfileNoteItem {
  /** 对外 uid：`TX` / `VD` + 11 位 */
  uid?: NoteResourceUid
  title: string
  summary: string
  contentType: '图文' | '视频'
  tags: string[]
  publishTime: string
  updateTime: string
  views: number
  comments: number
  favorites: number
  cover: string
  /** 作者昵称；Feed / 笔记列表等公共区域展示，禁止使用实名 */
  authorNickname?: string
  authorOrganization?: string
  authorAvatar?: string
  videoDuration?: string
  /** 笔记状态：DRAFT | REVIEWING | PUBLISHED | BANNED（个人空间本人视角返回） */
  status?: string
  /** 笔记可见性：PUBLIC | PRIVATE（个人空间本人视角返回） */
  visibility?: string
}
export type { TeamMemberRole } from '../../../api/teamProfile/types'

// 01）机构认证 role（OrgAuthRole，含 user_auth_link 全量枚举）
export type OrgAuthRole = 'PM' | 'MENTOR' | 'COUNSELOR' | 'STUDENT'

// 02）机构公开展示人员 role（OrgPublicMemberRole）
/** 机构空间「人员」区块仅展示 PM / MENTOR / COUNSELOR，不含 STUDENT */
export type OrgPublicMemberRole = 'PM' | 'MENTOR' | 'COUNSELOR'

// 03）机构关联人员项（ProfileOrgMemberItem）
export interface ProfileOrgMemberItem {
  uid: UserResourceUid
  nickname: string
  realName?: string | null
  /** user_auth_link.role，仅 PM | MENTOR */
  orgRole: OrgPublicMemberRole
  avatarUrl: string | null
  level: LevelCode | null
}

// 04）空间成员项（ProfileMemberItem）
export interface ProfileMemberItem {
  uid: UserResourceUid
  nickname: string
  /** 实名；管理成员与实验室成员可见场景使用 */
  realName?: string | null
  /** 团队身份：LEADER/MEMBER 为学生，MENTOR 为导师；LEADER 额外展示「负责人」 */
  role: TeamMemberRole
  /** 团队在组内定位，如「人工智能」「前端开发」 */
  career: string | null
  /** 是否为团队负责人（team.owner_uid）；LEADER 默认可视为负责人 */
  isOwner?: boolean
  /** 是否具备团队管理权限；负责人与协助管理员为 true */
  isAdmin?: boolean
  avatarUrl: string | null
  level: LevelCode | null
}

// 04）机构主体代码类型（EntityCode）
export type { EntityCode } from '../../../api/resourceUid'

// 04）机构下属团队预览项（ProfileTeamPreviewItem）
export interface ProfileTeamPreviewItem {
  teamUid: string
  name: string
  description: string | null
  logoUrl: string | null
  memberCount: number
  /** 实验室负责人 uid */
  leaderUid?: string | null
  /** 实验室负责人展示名称 */
  leaderDisplayName?: string | null
}

// 06）空间成果项（ProfileAchievementItem）
export interface ProfileAchievementItem {
  achievementUid: string
  maskedProjectName: string
  taskDescription: string
  technicalTags: string[]
  completedAt: string
}
