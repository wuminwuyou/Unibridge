import type { EntityCode } from '../../../shared/api/resourceUid'
import type { UserProfileNoteDto, UserProfileProjectDto } from '../../user/model/userProfileTypes'

// 01）机构主体类型（EntityProfileType）
export type EntityProfileType = 'ENTERPRISE' | 'UNIVERSITY'

// 02）机构页壳 coreProfile DTO（EntityProfileCoreProfileDto）
export interface EntityProfileCoreProfileDto {
  entityCode: EntityCode; name: string; intro: string; location: string
  type: EntityProfileType | string; logoUrl: string | null; bannerUrl: string | null; teamCount?: number
}

// 02.1）机构项目 DTO（EntityProfileProjectDto）—— 与个人空间项目结构一致
export type EntityProfileProjectDto = UserProfileProjectDto

// 02.2）机构笔记 DTO（EntityProfileNoteDto）—— 与个人空间笔记结构一致
export type EntityProfileNoteDto = UserProfileNoteDto

// 03）机构页壳 extendedProfile DTO（EntityProfileExtendedProfileDto）
export interface EntityProfileExtendedProfileDto { announcement: string }

// 04）机构下属团队预览 DTO（EntityProfileTeamPreviewDto）
export interface EntityProfileTeamPreviewDto {
  teamUid: string; name: string; description?: string | null; logoUrl?: string | null
  memberCount?: number; leaderUid?: string | null; leaderDisplayName?: string | null
}

// 05）机构认证 role（OrgAuthRole）
export type OrgAuthRole = 'PM' | 'MENTOR' | 'COUNSELOR' | 'STUDENT'

// 06）机构人员 DTO（EntityProfileMemberDto）
export interface EntityProfileMemberDto {
  uid?: string; userUid?: string; nickname: string; realName?: string | null
  role: OrgAuthRole | string; avatarUrl?: string | null; level?: string | null
}

// 07）机构页壳响应（EntityProfileSpaceData）
export interface EntityProfileSpaceData {
  entityCode: EntityCode; coreProfile: EntityProfileCoreProfileDto
  extendedProfile: EntityProfileExtendedProfileDto
  teamsPreview?: EntityProfileTeamPreviewDto[]; membersPreview?: EntityProfileMemberDto[]
  infoRows: { label: string; value: string }[]
}

// 08）机构主页 Tab 响应（EntityProfileHomeData）
export interface EntityProfileHomeData {
  entityCode: EntityCode; teams: EntityProfileTeamPreviewDto[]; members: EntityProfileMemberDto[]
  projects: EntityProfileProjectDto[]; notes: EntityProfileNoteDto[]; teamTotal?: number; memberTotal?: number
  projectTotal?: number; noteTotal?: number
}

// 09）机构实验室 Tab 响应（EntityProfileTeamsData）
export interface EntityProfileTeamsData { entityCode: EntityCode; teams: EntityProfileTeamPreviewDto[]; total: number; page: number; pageSize: number }

// 10）机构项目/笔记/人员分页数据类型
export interface EntityProfileProjectsData { entityCode: EntityCode; projects: EntityProfileProjectDto[]; total: number; page: number; pageSize: number }
export interface EntityProfileNotesData { entityCode: EntityCode; notes: EntityProfileNoteDto[]; total: number; page: number; pageSize: number }
export interface EntityProfileMembersData { entityCode: EntityCode; members: EntityProfileMemberDto[]; total: number; page: number; pageSize: number }

// 11）机构顶部菜单数据（EntityProfileMenuData）
export interface EntityProfileMenuData {
  entityCode: EntityCode; entityName: string; logoUrl: string | null
  boundAdminCount: number; minAdminCount: number; maxAdminCount: number
  entityFullyActivated: boolean
}

// 12）CRUD 操作类型
export interface CreateEntityTeamRequest { entityCode: EntityCode; name: string; tags?: string[]; description?: string; leaderUid?: string; logoUrl?: string }
export interface CreateEntityTeamResponse { teamUid: string; name: string }
export interface UpdateEntityTeamRequest { entityCode?: string; name?: string; tags?: string[]; description?: string; leaderUid?: string | null; logoUrl?: string }
export interface AddEntityMemberRequest { entityCode: EntityCode; uid: string; role: string }
export interface AddEntityMemberResponse { uid: string; role: OrgAuthRole | string }
export interface RemoveEntityMemberRequest { entityCode: EntityCode; uid: string }
