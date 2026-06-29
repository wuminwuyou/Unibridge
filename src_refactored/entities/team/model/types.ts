// 01）团队成员角色（TeamMemberRole）— 与 entities/member 保持一致
import type { TeamResourceUid, UserResourceUid } from '../../../shared/api/resourceUid'
import type { UserProfileNoteDto, UserProfileProjectDto } from '../../user/model/userProfileTypes'

export type TeamMemberRole = 'LEADER' | 'MEMBER' | 'MENTOR'

// 02）团队项目 DTO（TeamProfileProjectDto）
export type TeamProfileProjectDto = UserProfileProjectDto

// 03）团队页壳 coreProfile DTO（TeamProfileCoreProfileDto）
export interface TeamProfileCoreProfileDto {
  teamUid: TeamResourceUid
  name: string
  description: string
  organizationName: string | null
  logoUrl: string | null
  memberCount: number
  foundedAt: string
}

// 04）团队页壳 extendedProfile DTO（TeamProfileExtendedProfileDto）
export interface TeamProfileExtendedProfileDto {
  notice: string
  researchDirection: string
  contactEmail: string | null
}

// 05）团队成员 DTO（TeamProfileMemberDto）
export interface TeamProfileMemberDto {
  uid?: string
  userUid?: string
  nickname: string
  realName?: string | null
  role: TeamMemberRole | string
  career?: string | null
  isOwner?: boolean
  isAdmin?: boolean
  avatarUrl: string | null
  level: string | null
}

// 06）团队信息行 DTO（TeamProfileInfoRowDto）
export interface TeamProfileInfoRowDto {
  label: string
  value: string
}

// 07）团队页壳响应（TeamProfileSpaceData）
export interface TeamProfileSpaceData {
  teamUid: TeamResourceUid
  coreProfile: TeamProfileCoreProfileDto
  extendedProfile: TeamProfileExtendedProfileDto
  members: TeamProfileMemberDto[]
  infoRows: TeamProfileInfoRowDto[]
}

// 08）团队成果 DTO（TeamProfileAchievementDto）
export interface TeamProfileAchievementDto {
  achievementUid: string
  maskedProjectName: string
  taskDescription: string
  technicalTags: string[]
  completedAt: string
}

// 09）团队主页 Tab 响应（TeamProfileHomeData）
export interface TeamProfileHomeData {
  teamUid: TeamResourceUid
  projects: TeamProfileProjectDto[]
  notes: UserProfileNoteDto[]
  achievements: TeamProfileAchievementDto[]
  projectTotal?: number
  noteTotal?: number
  achievementTotal?: number
}

// 10）团队成员分页（TeamProfileMembersData）
export interface TeamProfileMembersData {
  teamUid: TeamResourceUid
  members: TeamProfileMemberDto[]
  total: number
  page: number
  pageSize: number
}

// 11）团队项目分页（TeamProfileProjectsData）
export interface TeamProfileProjectsData {
  teamUid: TeamResourceUid
  projects: TeamProfileProjectDto[]
  total: number
  page: number
  pageSize: number
}

// 12）团队笔记分页（TeamProfileNotesData）
export interface TeamProfileNotesData {
  teamUid: TeamResourceUid
  notes: UserProfileNoteDto[]
  total: number
  page: number
  pageSize: number
}

// 13）团队成果分页（TeamProfileAchievementsData）
export interface TeamProfileAchievementsData {
  teamUid: TeamResourceUid
  achievements: TeamProfileAchievementDto[]
  total: number
  page: number
  pageSize: number
}

// 14）成员更新项（TeamProfileMemberUpdateDto）
export interface TeamProfileMemberUpdateDto {
  uid: UserResourceUid
  career: string
  isAdmin?: boolean
}

// 15）成员新增项（TeamProfileMemberAdditionDto）
export interface TeamProfileMemberAdditionDto {
  uid: UserResourceUid
  role: Extract<TeamMemberRole, 'MEMBER' | 'MENTOR'>
  career: string
}

// 16）成员移除项（TeamProfileMemberRemovalDto）
export interface TeamProfileMemberRemovalDto { uid: UserResourceUid }

// 17）批量更新团队成员请求（UpdateTeamProfileMembersRequest）
export interface UpdateTeamProfileMembersRequest {
  updates?: TeamProfileMemberUpdateDto[]
  additions?: TeamProfileMemberAdditionDto[]
  removals?: TeamProfileMemberRemovalDto[]
}

// 18）批量更新团队成员响应（UpdateTeamProfileMembersResponse）
export interface UpdateTeamProfileMembersResponse {
  teamUid: TeamResourceUid
  members: TeamProfileMemberDto[]
  total: number
}

// 19）创建学生团队请求 / 响应
export interface CreateStudentTeamRequest {
  name: string
  description?: string
  initialMemberUids?: string[]
}
export interface CreateStudentTeamResponse {
  teamUid: TeamResourceUid
  name: string
}
