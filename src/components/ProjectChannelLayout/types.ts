import type { Announcement, ProjectItem, RecommendedCompany } from '../../types/project'
import type { ProfileNoteItem } from '../../pages/ProfileSpace/components/types'

// 01）项目频道布局对外参数（ProjectChannelLayoutProps）
/**
 * 使用方：
 * - HomePage（默认项目频道，传入 experienceRecommendedNotes 显示经验推荐区）
 * - CampusRecruitPage（高校招募频道，侧栏改为推荐本校实验室）
 * - EnterprisePracticePage（企业实战频道，侧栏为推荐企业）
 */
/** 首页上下分栏；频道页默认左右分栏 */
export type ProjectChannelLayoutVariant = 'default' | 'stacked'

export interface ProjectChannelLayoutProps {
  sectionTitle: string
  searchInputId: string
  projects: ProjectItem[]
  experienceRecommendedNotes?: ProfileNoteItem[]
  /** 布局变体；HomePage 使用 stacked（上笔记 / 下项目+侧栏） */
  layout?: ProjectChannelLayoutVariant
  /** 经验/笔记区标题；HomePage 为「笔记专区」 */
  notesSectionTitle?: string
  recommendedTypes: string[]
  recommendedOrganizations: RecommendedCompany[]
  announcements: Announcement[]
  organizationCardTitle?: string
  organizationActionText?: string
  organizationAvatarText?: string
}
