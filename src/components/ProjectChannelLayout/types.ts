import type { Announcement, ProjectItem, RecommendedCompany } from '../../types/project'
import type { ProjectLabFilterTab } from './projectLabFilters'

// 01）项目频道布局对外参数（ProjectChannelLayoutProps）
/**
 * 使用方：
 * - CommercialProjectsPage（企业实战频道，侧栏为推荐企业）
 * - CampusCoCreationPage（高校共创频道，侧栏为推荐本校实验室）
 */
export interface ProjectChannelLayoutProps {
  /** 左侧项目区无障碍标签 */
  projectsSectionLabel: string
  projects: ProjectItem[]
  labTitle?: string
  labSubtitle?: string
  filterTabs?: ProjectLabFilterTab[]
  recommendedTypes: string[]
  recommendedOrganizations: RecommendedCompany[]
  announcements: Announcement[]
  organizationCardTitle?: string
  organizationActionText?: string
  organizationAvatarText?: string
}
