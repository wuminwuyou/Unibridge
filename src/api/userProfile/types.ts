// 01）用户资料菜单数据类型定义（UserProfileMenuData）
export interface UserProfileMenuData {
  userId: number
  nickname: string
  level: string | null
  avatarUrl: string | null
  verifiedOrganization: string | null
}

// 02）个人空间页壳 baseInfo 类型（UserProfileSpaceBaseInfo）
export interface UserProfileSpaceBaseInfo {
  /** 可选；标准响应中 id 位于顶层 data.id */
  id?: number
  nickname: string
  avatarText?: string
  avatarUrl: string | null
  isVerified: boolean
  organization: string | null
  position: string | null
  bio: string
  level: string | null
}

// 03）个人空间页壳 extendInfo 类型（UserProfileSpaceExtendInfo）
export interface UserProfileSpaceExtendInfo {
  notice: string
  verifyStatus?: string | null
  ipLocation: string
  joinDate: string
  careerData?: string[]
  skills: string[]
}

// 04）个人空间页壳 associatedTeam 类型（UserProfileSpaceAssociatedTeam）
export interface UserProfileSpaceAssociatedTeam {
  id: number
  name: string
  description: string
  entryPath: string
}

// 05）个人空间页壳响应数据类型（UserProfileSpaceData）
export interface UserProfileSpaceData {
  id: number
  baseInfo: UserProfileSpaceBaseInfo
  extendInfo: UserProfileSpaceExtendInfo
  associatedTeam: UserProfileSpaceAssociatedTeam | null
  honors: unknown[]
  activityHeatmap: number[]
}

// 06）个人空间项目 DTO（UserProfileProjectDto）
export interface UserProfileProjectDto {
  title: string
  summary: string
  tags: { label: string }[]
  company: string
  publisher: string
  publishTime: string
  level: string
  amount: string
}

// 07）个人空间笔记 DTO（UserProfileNoteDto）
export interface UserProfileNoteDto {
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
}

// 08）个人空间主页 Tab 响应（UserProfileHomeData）
export interface UserProfileHomeData {
  userId: number
  projects: UserProfileProjectDto[]
  notes: UserProfileNoteDto[]
  projectTotal?: number
  noteTotal?: number
}

// 09）个人空间项目 Tab 响应（UserProfileProjectsData）
export interface UserProfileProjectsData {
  userId: number
  projects: UserProfileProjectDto[]
  total: number
  page: number
  pageSize: number
}

// 10）个人空间笔记 Tab 响应（UserProfileNotesData）
export interface UserProfileNotesData {
  userId: number
  notes: UserProfileNoteDto[]
  total: number
  page: number
  pageSize: number
}
