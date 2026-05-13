// 01）主题模式类型定义（ThemeMode）
export type ThemeMode = 'light' | 'dark'

// 02）项目标签类型定义（ProjectTag）
export interface ProjectTag {
  label: string
}

// 03）项目数据类型定义（ProjectItem）
export interface ProjectItem {
  title: string
  summary: string
  tags: ProjectTag[]
  company: string
  publisher: string
  publishTime: string
  level: 'N' | 'R' | 'SR' | 'SSR' | 'UR'
  amount: string
}

// 04）推荐企业类型定义（RecommendedCompany）
export interface RecommendedCompany {
  name: string
  projects: string
}

// 05）平台公告类型定义（Announcement）
export interface Announcement {
  title: string
  date: string
}
