import type { LevelCode } from './level'
import type { ProjectResourceUid } from '../api/resourceUid'

// 01）高校招募子类型（CampusRecruitType）— 发布表单与 ProjectDetail 共用
export type CampusRecruitType = 'LAB_RECRUIT' | 'TEAM_RECRUIT' | 'PERSONAL_RECRUIT'

// 02）项目分类（ProjectCategory）- 对应 project.category
export type ProjectCategory = 'COMMERCIAL' | 'RECRUITMENT'

// 03）招募子类型（ProjectRecruitmentType）- 对应 project.recruitment_type
export type ProjectRecruitmentType =
  | 'LAB_RECRUIT'
  | 'TEAM_RECRUIT'
  | 'CAMPUS_PRACTICE'
  | 'PERSONAL_RECRUIT'

// 03）项目状态（ProjectStatus）- 对应 project.status
export type ProjectStatus = 'DRAFT' | 'OPEN' | 'ONGOING' | 'CLOSED'

// 04）项目标签类型定义（ProjectTag）
export interface ProjectTag {
  label: string
}

// 05）项目列表卡片数据（ProjectItem）
/**
 * 使用方：ProjectCard、项目频道页、个人空间项目列表。
 * 字段对齐 db.sql project 表；商业预算来自 project_commercial_secret.total_budget。
 */
export interface ProjectItem {
  /** 对外 uid：`PR` + 11 位；卡片跳转与读接口禁止使用自增 id */
  uid?: ProjectResourceUid
  title: string
  /** 对应 project.preview */
  preview: string
  tags: ProjectTag[]
  /** 对应 project.category */
  category: ProjectCategory
  /** 对应 project.recruitment_type；仅 RECRUITMENT 有效 */
  recruitmentType?: ProjectRecruitmentType | null
  /** 发布主体：企业名 / 实验室或团队名（owner 所属主体或 team） */
  ownerOrganization: string
  /** 发布人名称（项目发布者的显示名），卡片 meta 行展示 */
  publisherName?: string | null
  /** 发布人头像 URL */
  publisherAvatar?: string | null
  /** 卡片底部时间展示（published_at 格式化或相对时间）；当前 ProjectCard 不展示 */
  publishTime: string
  level: LevelCode
  /** 预算区间最小值（数字字符串或纯数字），卡片右上角展示 */
  amountMin?: string | null
  /** 预算区间最大值（数字字符串或纯数字），卡片右上角展示 */
  amountMax?: string | null
  /** 商业项目托管预算（已废弃，保留兼容） */
  budget?: string | null
  /** 发布主体 Logo SVG 地址，对应 entity_profile.logo_url */
  logoSvgUrl?: string | null
  /** 对应 project.duration */
  duration?: string | null
  status?: ProjectStatus
}

// 06）推荐企业/实验室类型定义（RecommendedCompany）
export interface RecommendedCompany {
  name: string
  projects: string
}

// 07）平台公告类型定义（Announcement）
export interface Announcement {
  title: string
  date: string
}
