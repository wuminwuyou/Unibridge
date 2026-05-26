import type { EntityCode } from '../resourceUid'
import type { UserProfileNoteDto, UserProfileProjectDto } from '../userProfile/types'

// 01）机构主体类型（EntityProfileType）
export type EntityProfileType = 'ENTERPRISE' | 'UNIVERSITY'

// 02）机构页壳 coreProfile DTO（EntityProfileCoreProfileDto）
export interface EntityProfileCoreProfileDto {
  entityCode: EntityCode
  name: string
  intro: string
  location: string
  type: EntityProfileType | string
  logoUrl: string | null
  bannerUrl: string | null
  teamCount?: number
}

// 03）机构页壳 extendedProfile DTO（EntityProfileExtendedProfileDto）
export interface EntityProfileExtendedProfileDto {
  announcement: string
}

// 04）机构下属团队预览 DTO（EntityProfileTeamPreviewDto）
export interface EntityProfileTeamPreviewDto {
  teamUid: string
  name: string
  description?: string | null
  logoUrl?: string | null
  memberCount?: number
}

// 05）机构信息表格行 DTO（EntityProfileInfoRowDto）
export interface EntityProfileInfoRowDto {
  label: string
  value: string
}

// 05）机构认证 role（OrgAuthRole）
export type OrgAuthRole = 'PM' | 'MENTOR' | 'STUDENT'

// 06）机构人员 DTO（EntityProfileMemberDto）
export interface EntityProfileMemberDto {
  uid?: string
  userUid?: string
  nickname: string
  realName?: string | null
  /** user_auth_link.role */
  role: OrgAuthRole | string
  avatarUrl?: string | null
  level?: string | null
}

// 07）机构页壳响应（EntityProfileSpaceData）
export interface EntityProfileSpaceData {
  entityCode: EntityCode
  coreProfile: EntityProfileCoreProfileDto
  extendedProfile: EntityProfileExtendedProfileDto
  teamsPreview?: EntityProfileTeamPreviewDto[]
  membersPreview?: EntityProfileMemberDto[]
  infoRows: EntityProfileInfoRowDto[]
}

// 08）机构主页 Tab 响应（EntityProfileHomeData）
export interface EntityProfileHomeData {
  entityCode: EntityCode
  teams: EntityProfileTeamPreviewDto[]
  members: EntityProfileMemberDto[]
  projects: UserProfileProjectDto[]
  notes: UserProfileNoteDto[]
  teamTotal?: number
  memberTotal?: number
  projectTotal?: number
  noteTotal?: number
}

// 09）机构实验室 Tab 响应（EntityProfileTeamsData）
export interface EntityProfileTeamsData {
  entityCode: EntityCode
  teams: EntityProfileTeamPreviewDto[]
  total: number
  page: number
  pageSize: number
}

// 10）机构项目 Tab 响应（EntityProfileProjectsData）
export interface EntityProfileProjectsData {
  entityCode: EntityCode
  projects: UserProfileProjectDto[]
  total: number
  page: number
  pageSize: number
}

// 11）机构笔记 Tab 响应（EntityProfileNotesData）
export interface EntityProfileNotesData {
  entityCode: EntityCode
  notes: UserProfileNoteDto[]
  total: number
  page: number
  pageSize: number
}

// 12）机构人员 Tab 响应（EntityProfileMembersData）
export interface EntityProfileMembersData {
  entityCode: EntityCode
  members: EntityProfileMemberDto[]
  total: number
  page: number
  pageSize: number
}
