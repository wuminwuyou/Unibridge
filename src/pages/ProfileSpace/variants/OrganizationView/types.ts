import type { EntityCode } from '../../../../api/resourceUid'
import type { ProjectItem } from '../../../../types/project'
import type { ProfileNoteItem, ProfileOrgMemberItem, ProfileTeamPreviewItem } from '../../components/types'

// 01）机构空间 Tab 常量
export const ORGANIZATION_TAB_HOME = '主页' as const
export const ORGANIZATION_TAB_LABS = '实验室' as const
export const ORGANIZATION_TAB_MEMBERS = '人员' as const
export const ORGANIZATION_TAB_PROJECTS = '项目' as const
export const ORGANIZATION_TAB_NOTES = '笔记' as const

// 02）机构空间 Tab 类型（OrganizationTab）
export type OrganizationTab =
  | typeof ORGANIZATION_TAB_HOME
  | typeof ORGANIZATION_TAB_LABS
  | typeof ORGANIZATION_TAB_MEMBERS
  | typeof ORGANIZATION_TAB_PROJECTS
  | typeof ORGANIZATION_TAB_NOTES

// 03）构建机构 Tab 列表（buildOrganizationViewTabs）
/**
 * 函数名：buildOrganizationViewTabs
 * 功能：按是否支持实验室展示动态生成机构空间 Tab 列表。
 * 实现方法：
 * - supportsLabs 为 true（高校 5 位主体代码）→ 含「实验室」Tab
 * - supportsLabs 为 false（企业等）→ 隐藏「实验室」Tab
 * 输入：
 * - supportsLabs：是否展示实验室相关 UI
 * 输出：
 * - 返回值：OrganizationTab[]
 * - 副作用：无
 */
export function buildOrganizationViewTabs(supportsLabs: boolean): OrganizationTab[] {
  if (supportsLabs) {
    return [
      ORGANIZATION_TAB_HOME,
      ORGANIZATION_TAB_LABS,
      ORGANIZATION_TAB_MEMBERS,
      ORGANIZATION_TAB_PROJECTS,
      ORGANIZATION_TAB_NOTES,
    ]
  }

  return [
    ORGANIZATION_TAB_HOME,
    ORGANIZATION_TAB_MEMBERS,
    ORGANIZATION_TAB_PROJECTS,
    ORGANIZATION_TAB_NOTES,
  ]
}

// 04）机构核心信息（OrganizationCoreProfile）
export interface OrganizationCoreProfile {
  entityCode: EntityCode
  name: string
  intro: string
  location: string
  type: 'ENTERPRISE' | 'UNIVERSITY'
  typeLabel: string
  logoUrl: string | null
  bannerUrl: string | null
  teamCount: number
  memberCount: number
  /** 是否展示实验室相关 UI（按 entityCode 位数判断） */
  supportsLabs: boolean
}

// 05）机构扩展信息（OrganizationExtendedProfile）
export interface OrganizationExtendedProfile {
  announcement: string
}

// 06）机构信息表格行（OrganizationInfoRow）
export interface OrganizationInfoRow {
  label: string
  value: string
}

// 07）机构下属团队项（OrganizationTeamItem）
export type OrganizationTeamItem = ProfileTeamPreviewItem

// 08）机构人员项（OrganizationMemberItem）
export type OrganizationMemberItem = ProfileOrgMemberItem

// 09）机构空间内容数据（OrganizationSpaceContentData）
export interface OrganizationSpaceContentData {
  orgProjects: ProjectItem[]
  orgNotes: ProfileNoteItem[]
  orgTeams: OrganizationTeamItem[]
  orgMembers: OrganizationMemberItem[]
}
