import type { TeamResourceUid } from '../../../../api/resourceUid'
import type { ProjectItem } from '../../../../types/project'
import type { ProfileAchievementItem, ProfileMemberItem, ProfileNoteItem } from '../../components/types'

// 01）团队空间 Tab 列表（teamViewTabs）
export const teamViewTabs = ['主页', '成员', '成果', '项目', '笔记'] as const

// 02）团队空间 Tab 类型（TeamTab）
export type TeamTab = (typeof teamViewTabs)[number]

// 03）团队核心信息（TeamCoreProfile）
export interface TeamCoreProfile {
  teamUid: TeamResourceUid
  name: string
  description: string
  organizationName: string | null
  logoUrl: string | null
  memberCount: number
  foundedAt: string
}

// 03）团队扩展信息（TeamExtendedProfile）
export interface TeamExtendedProfile {
  notice: string
  researchDirection: string
  contactEmail: string | null
}

// 04）团队成员项（TeamMemberItem）
export type TeamMemberItem = ProfileMemberItem

// 05）团队信息表格行（TeamInfoRow）
export interface TeamInfoRow {
  label: string
  value: string
}

// 06）团队成果项（TeamAchievementItem）
export type TeamAchievementItem = ProfileAchievementItem

// 07）团队空间内容数据（TeamSpaceContentData）
export interface TeamSpaceContentData {
  teamProjects: ProjectItem[]
  teamNotes: ProfileNoteItem[]
  teamAchievements: TeamAchievementItem[]
}
