import type { TeamResourceUid } from '../resourceUid'
import type { UserProfileNoteDto, UserProfileProjectDto } from '../userProfile/types'

// 01.0）团队成员 role（TeamMemberRole）
export type TeamMemberRole = 'LEADER' | 'MEMBER' | 'MENTOR'

// 01.1）团队空间项目 DTO（TeamProfileProjectDto）
/** 团队 profile 项目列表项；含 status（进行中/已结项等），与 UserProfileProjectDto 字段一致 */
export type TeamProfileProjectDto = UserProfileProjectDto

// 01）团队页壳 coreProfile DTO（TeamProfileCoreProfileDto）
export interface TeamProfileCoreProfileDto {
  teamUid: TeamResourceUid
  name: string
  description: string
  organizationName: string | null
  logoUrl: string | null
  memberCount: number
  foundedAt: string
}

// 02）团队页壳 extendedProfile DTO（TeamProfileExtendedProfileDto）
export interface TeamProfileExtendedProfileDto {
  notice: string
  researchDirection: string
  contactEmail: string | null
}

// 03）团队成员 DTO（TeamProfileMemberDto）
export interface TeamProfileMemberDto {
  uid?: string
  userUid?: string
  nickname: string
  /** 实名；管理成员表单与实验室成员可见场景展示 */
  realName?: string | null
  /** LEADER（负责人/队长）| MEMBER（学生）| MENTOR（导师） */
  role: TeamMemberRole | string
  /** 团队在组内定位，如「人工智能」「前端开发」 */
  career?: string | null
  /** 是否为 team.owner_uid 对应成员；排序首位通常为负责人 */
  isOwner?: boolean
  /** 是否具备团队管理权限（含负责人；可有多名协助管理员） */
  isAdmin?: boolean
  avatarUrl: string | null
  level: string | null
}

// 04）团队信息表格行 DTO（TeamProfileInfoRowDto）
export interface TeamProfileInfoRowDto {
  label: string
  value: string
}

// 05）团队页壳响应（TeamProfileSpaceData）
export interface TeamProfileSpaceData {
  teamUid: TeamResourceUid
  coreProfile: TeamProfileCoreProfileDto
  extendedProfile: TeamProfileExtendedProfileDto
  members: TeamProfileMemberDto[]
  infoRows: TeamProfileInfoRowDto[]
}

// 06）团队成果 DTO（TeamProfileAchievementDto）
export interface TeamProfileAchievementDto {
  achievementUid: string
  maskedProjectName: string
  taskDescription: string
  technicalTags: string[]
  completedAt: string
}

// 07）团队主页 Tab 响应（TeamProfileHomeData）
export interface TeamProfileHomeData {
  teamUid: TeamResourceUid
  projects: TeamProfileProjectDto[]
  notes: UserProfileNoteDto[]
  achievements: TeamProfileAchievementDto[]
  projectTotal?: number
  noteTotal?: number
  achievementTotal?: number
}

// 08）团队成员 Tab 响应（TeamProfileMembersData）
export interface TeamProfileMembersData {
  teamUid: TeamResourceUid
  members: TeamProfileMemberDto[]
  total: number
  page: number
  pageSize: number
}

// 09）团队项目 Tab 响应（TeamProfileProjectsData）
export interface TeamProfileProjectsData {
  teamUid: TeamResourceUid
  projects: TeamProfileProjectDto[]
  total: number
  page: number
  pageSize: number
}

// 10）团队笔记 Tab 响应（TeamProfileNotesData）
export interface TeamProfileNotesData {
  teamUid: TeamResourceUid
  notes: UserProfileNoteDto[]
  total: number
  page: number
  pageSize: number
}

// 11）团队成果 Tab 响应（TeamProfileAchievementsData）
export interface TeamProfileAchievementsData {
  teamUid: TeamResourceUid
  achievements: TeamProfileAchievementDto[]
  total: number
  page: number
  pageSize: number
}

// 12）管理成员更新项（TeamProfileMemberUpdateDto）
export interface TeamProfileMemberUpdateDto {
  uid: string
  career: string
  isAdmin?: boolean
}

// 13）管理成员新增项（TeamProfileMemberAdditionDto）
export interface TeamProfileMemberAdditionDto {
  uid: string
  role: Extract<TeamMemberRole, 'MEMBER' | 'MENTOR'>
  career: string
}

// 14）管理成员移除项（TeamProfileMemberRemovalDto）
export interface TeamProfileMemberRemovalDto {
  uid: string
}

// 15）批量更新团队成员请求（UpdateTeamProfileMembersRequest）
export interface UpdateTeamProfileMembersRequest {
  updates?: TeamProfileMemberUpdateDto[]
  additions?: TeamProfileMemberAdditionDto[]
  removals?: TeamProfileMemberRemovalDto[]
}

// 16）批量更新团队成员响应（UpdateTeamProfileMembersResponse）
export interface UpdateTeamProfileMembersResponse {
  teamUid: TeamResourceUid
  members: TeamProfileMemberDto[]
  total: number
}
