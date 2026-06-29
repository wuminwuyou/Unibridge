import type { NoteResourceUid, TeamResourceUid, UserResourceUid } from '../../../shared/api/resourceUid'

// 01）团队成员角色（TeamMemberRole）— 与 entities/member 保持一致
export type TeamMemberRole = 'LEADER' | 'MEMBER' | 'MENTOR'

// 02）团队资料核心档案 DTO（TeamProfileCoreProfileDto）
export interface TeamProfileCoreProfileDto {
  teamUid: TeamResourceUid; name: string; avatarUrl: string | null
  description: string; memberCount: number; projectCount: number
  noteCount: number; achievementCount: number
}

// 03）团队资料扩展档案 DTO（TeamProfileExtendedProfileDto）
export interface TeamProfileExtendedProfileDto {
  tags: string[]; banner: string; joinStatus: string | null
}

// 04）团队信息行 DTO（TeamProfileInfoRowDto）
export interface TeamProfileInfoRowDto {
  label: string; value: string; icon?: string
}

// 05）团队空间页壳数据（TeamProfileSpaceData）
export interface TeamProfileSpaceData {
  coreProfile: TeamProfileCoreProfileDto
  extendedProfile?: TeamProfileExtendedProfileDto
  infoRows: TeamProfileInfoRowDto[]
  memberPreviews: TeamProfileMemberDto[]
}

// 06）团队成员 DTO（TeamProfileMemberDto）
export interface TeamProfileMemberDto {
  uid: UserResourceUid; nickname: string; realName?: string | null
  avatarUrl: string | null; role: TeamMemberRole; career?: string | null
  level?: string | null
}

// 07）团队主页数据（TeamProfileHomeData）
export interface TeamProfileHomeData {
  memberPreviews: TeamProfileMemberDto[]
  projectPreviews: unknown[]
  notePreviews: unknown[]
  achievementPreviews: unknown[]
}

// 08）团队成员分页数据（TeamProfileMembersData）
export interface TeamProfileMembersData {
  members: TeamProfileMemberDto[]; total: number; page: number; pageSize: number
}

// 09）团队项目 DTO（TeamProfileProjectDto）
export interface TeamProfileProjectDto {
  uid: string; title: string; summary: string; status: string
  level?: string; teamSize?: string; duration?: string
}

// 10）团队项目分页数据（TeamProfileProjectsData）
export interface TeamProfileProjectsData {
  projects: TeamProfileProjectDto[]; total: number; page: number; pageSize: number
}

// 11）团队笔记分页数据（TeamProfileNotesData）
export interface TeamProfileNotesData {
  notes: unknown[]; total: number; page: number; pageSize: number
}

// 12）团队成果 DTO（TeamProfileAchievementDto）
export interface TeamProfileAchievementDto {
  uid: string; name: string; url: string | null; description?: string
}

// 13）团队成果分页数据（TeamProfileAchievementsData）
export interface TeamProfileAchievementsData {
  achievements: TeamProfileAchievementDto[]; total: number; page: number; pageSize: number
}

// 14）成员更新项（TeamProfileMemberUpdateDto）
export interface TeamProfileMemberUpdateDto {
  uid: UserResourceUid
  career?: string | null
  role?: TeamMemberRole
  isAdmin?: boolean
}

// 15）成员添加项（TeamProfileMemberAdditionDto）
export interface TeamProfileMemberAdditionDto {
  uid: UserResourceUid; role: TeamMemberRole; career?: string | null
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
  updated: number; added: number; removed: number
}

// 19）创建学生团队请求/响应
export interface CreateStudentTeamRequest { name: string; description?: string }
export interface CreateStudentTeamResponse { teamUid: TeamResourceUid; name: string }
