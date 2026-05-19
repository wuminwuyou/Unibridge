import type { Announcement, ProjectItem, RecommendedCompany } from '../../types/project'
import type { ProfileNoteItem } from '../profile/types'

// 01）项目频道布局对外参数（ProjectChannelLayoutProps）
/**
 * 使用方：
 * - HomePage（默认项目频道，传入 experienceRecommendedNotes 显示经验推荐区）
 * - CampusRecruitPage（高校招募频道，侧栏改为推荐本校实验室）
 * - EnterprisePracticePage（企业实战频道，侧栏为推荐企业）
 */
export interface ProjectChannelLayoutProps {
  sectionTitle: string
  searchInputId: string
  projects: ProjectItem[]
  experienceRecommendedNotes?: ProfileNoteItem[]
  recommendedTypes: string[]
  recommendedOrganizations: RecommendedCompany[]
  announcements: Announcement[]
  organizationCardTitle?: string
  organizationActionText?: string
  organizationAvatarText?: string
}
