// 01）个人空间 DTO 类型（与后端 /user-profile/* 一致）
import type {
  NoteResourceUid, ProjectResourceUid, TeamResourceUid, UserResourceUid,
} from '@shared/api/resourceUid'

// 02）用户资料菜单数据（UserProfileMenuData）
export interface UserProfileMenuData {
  uid: UserResourceUid
  nickname: string
  level: string | null
  avatarUrl: string | null
  verifyStatus?: string | null
  verifiedOrganization: string | null
}

// 03）个人空间页壳 baseInfo（UserProfileSpaceBaseInfo）
export interface UserProfileSpaceBaseInfo {
  uid?: UserResourceUid
  nickname: string
  avatarText?: string
  avatarUrl: string | null
  isVerified: boolean
  organization: string | null
  position: string | null
  bio: string
  level: string | null
}

// 04）个人空间页壳 extendInfo（UserProfileSpaceExtendInfo）
export interface UserProfileSpaceExtendInfo {
  notice: string
  verifyStatus?: string | null
  ipLocation: string
  joinDate: string
  careerData?: string[]
  skills: string[]
}

// 05）个人空间关联团队项（UserProfileSpaceAssociatedTeam）
export interface UserProfileSpaceAssociatedTeam {
  teamUid: TeamResourceUid
  name: string
  description: string
  entryPath: string
}

// 06）个人空间页壳响应（UserProfileSpaceData）
export interface UserProfileSpaceData {
  uid: UserResourceUid
  baseInfo: UserProfileSpaceBaseInfo
  extendInfo: UserProfileSpaceExtendInfo
  associatedTeam: UserProfileSpaceAssociatedTeam[]
  honors: unknown[]
  activityHeatmap: number[]
}

// 07）个人空间项目 DTO（UserProfileProjectDto）
export interface UserProfileProjectDto {
  uid?: ProjectResourceUid
  title: string
  preview?: string
  summary?: string
  tags: { label: string }[]
  category?: 'COMMERCIAL' | 'RECRUITMENT'
  recruitmentType?: 'LAB_RECRUIT' | 'TEAM_RECRUIT' | 'CAMPUS_PRACTICE' | 'PERSONAL_RECRUIT' | null
  ownerOrganization?: string
  company?: string
  publishTime: string
  level: string
  budget?: string | null
  amount?: string
  logoSvgUrl?: string | null
  teamSize?: string | null
  duration?: string | null
  status?: 'DRAFT' | 'OPEN' | 'ONGOING' | 'CLOSED'
}

// 08）个人空间笔记 DTO（UserProfileNoteDto）
export interface UserProfileNoteDto {
  uid: NoteResourceUid
  title: string
  summary: string
  contentType: string
  tags: string[]
  publishTime: string
  updateTime: string
  views: number
  comments: number
  favorites: number
  cover: string
  authorNickname?: string
  /** 个人空间笔记接口实际返回字段（authorNickName） */
  authorNickName?: string
  authorName?: string
  authorAvatar?: string | null
  videoDuration?: string | number | null
}

// 09）个人空间主页 Tab 响应（UserProfileHomeData）
export interface UserProfileHomeData {
  uid: UserResourceUid
  projects: UserProfileProjectDto[]
  notes: UserProfileNoteDto[]
  projectTotal?: number
  noteTotal?: number
}

// 10）个人空间项目 Tab 响应（UserProfileProjectsData）
export interface UserProfileProjectsData {
  uid: UserResourceUid
  projects: UserProfileProjectDto[]
  total: number
  page: number
  pageSize: number
}

// 11）个人空间笔记 Tab 响应（UserProfileNotesData）
export interface UserProfileNotesData {
  uid: UserResourceUid
  notes: UserProfileNoteDto[]
  total: number
  page: number
  pageSize: number
}
