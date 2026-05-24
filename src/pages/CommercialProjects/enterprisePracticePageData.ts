import type { Announcement, ProjectItem, RecommendedCompany } from '../../types/project'

// 01）企业实战项目数据（enterprisePracticeProjects）
export const enterprisePracticeProjects: ProjectItem[] = [
  {
    uid: 'PR00000003001',
    title: '企业数据中台可视化驾驶舱开发',
    preview: '为集团管理层构建经营驾驶舱，接入销售、供应链、财务等核心指标并支持多维钻取。',
    tags: [{ label: '数据中台' }, { label: 'ECharts' }, { label: 'Vue3' }],
    category: 'COMMERCIAL',
    ownerOrganization: '华为云联合实验室',
    publishTime: '1小时前发布',
    level: 'SR',
    budget: '32,000',
    teamSize: '3-5人',
    duration: '2个月',
    status: 'OPEN',
  },
  {
    uid: 'PR00000003002',
    title: '跨端营销活动系统重构项目',
    preview: '统一企业营销活动配置平台，支持 H5/小程序/PC 多端投放与数据回流追踪。',
    tags: [{ label: 'React' }, { label: 'Node.js' }, { label: '多端' }],
    category: 'COMMERCIAL',
    ownerOrganization: '字节跳动企业服务',
    publishTime: '3小时前发布',
    level: 'R',
    budget: '26,800',
    teamSize: '4-6人',
    duration: '3个月',
    status: 'OPEN',
  },
  {
    uid: 'PR00000003003',
    title: '制造业排产优化算法平台',
    preview: '面向制造企业构建排产优化平台，结合约束求解与预测模型提升产线利用率。',
    tags: [{ label: 'Python' }, { label: '算法优化' }, { label: '工业场景' }],
    category: 'COMMERCIAL',
    ownerOrganization: '英伟达智造伙伴计划',
    publishTime: '6小时前发布',
    level: 'SSR',
    budget: '45,500',
    teamSize: '2-4人',
    duration: '4个月',
    status: 'OPEN',
  },
  {
    uid: 'PR00000003004',
    title: '企业官网国际化升级与性能优化',
    preview: '完成企业官网 i18n 改造、SEO 优化与前端性能治理，提升海外访问体验。',
    tags: [{ label: 'Next.js' }, { label: '性能优化' }, { label: '国际化' }],
    category: 'COMMERCIAL',
    ownerOrganization: '微软亚太技术中心',
    publishTime: '昨天发布',
    level: 'N',
    budget: '16,200',
    teamSize: '2-3人',
    duration: '1个月',
    status: 'OPEN',
  },
]

// 02）企业实战推荐项目类型（enterprisePracticeRecommendedTypes）
export const enterprisePracticeRecommendedTypes: string[] = [
  '企业数字化',
  'Web开发',
  '数据分析',
  'BI看板',
  '平台重构',
  'Python',
  '算法优化',
  '跨端开发',
]

// 03）企业实战推荐企业（enterprisePracticeRecommendedCompanies）
export const enterprisePracticeRecommendedCompanies: RecommendedCompany[] = [
  { name: '启元数字科技', projects: '76 个企业项目在招' },
  { name: '新蓝互联', projects: '64 个企业项目在招' },
  { name: '智造未来工业', projects: '51 个企业项目在招' },
  { name: '海拓国际', projects: '48 个企业项目在招' },
]

// 04）企业实战平台公告（enterprisePracticeAnnouncements）
export const enterprisePracticeAnnouncements: Announcement[] = [
  { title: '企业实战专项计划第 2 期开启报名', date: '05-26' },
  { title: '新增 12 家企业发布真实项目需求', date: '05-22' },
  { title: '企业项目结项答辩规范更新通知', date: '05-19' },
  { title: '平台联合企业开放线上宣讲专场', date: '05-16' },
]