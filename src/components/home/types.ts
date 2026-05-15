// 01）项目标签类型定义（ProjectTag）
export interface ProjectTag {
  label: string
}

// 02）项目数据类型定义（ProjectItem）
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

// 03）推荐企业类型定义（RecommendedCompany）
export interface RecommendedCompany {
  name: string
  projects: string
}

// 04）平台公告类型定义（Announcement）
export interface Announcement {
  title: string
  date: string
}
