import type { LevelCode } from './level'

// 01）项目标签类型定义（ProjectTag）
export interface ProjectTag {
  label: string
}

// 02）项目数据类型定义（ProjectItem）
/**
 * 使用方：
 * - HomePage / CampusRecruitPage / EnterprisePracticePage（项目频道列表卡片）
 * - ProfileSpacePage（个人空间项目页签）
 * - ProjectCard / ProjectChannelLayout 等展示组件
 */
export interface ProjectItem {
  title: string
  summary: string
  tags: ProjectTag[]
  company: string
  publisher: string
  publishTime: string
  level: LevelCode
  amount: string
}

// 03）推荐企业/实验室类型定义（RecommendedCompany）
/**
 * 用途：
 * - 项目频道页右侧「推荐企业」/「推荐本校实验室」卡片数据契约
 */
export interface RecommendedCompany {
  name: string
  projects: string
}

// 04）平台公告类型定义（Announcement）
/**
 * 用途：
 * - 项目频道页右侧「平台公告」卡片数据契约
 */
export interface Announcement {
  title: string
  date: string
}
