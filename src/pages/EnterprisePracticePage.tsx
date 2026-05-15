import ProjectZonePageLayout from '../components/home/ProjectZonePageLayout'
import type { Announcement, ProjectItem, RecommendedCompany } from '../components/home/types'
import '../styles/HomePage.css'

// 01）企业实战项目数据（enterpriseProjects）
const enterpriseProjects: ProjectItem[] = [
  {
    title: '企业数据中台可视化驾驶舱开发',
    summary: '为集团管理层构建经营驾驶舱，接入销售、供应链、财务等核心指标并支持多维钻取。',
    tags: [{ label: '企业实战' }, { label: '数据中台' }, { label: 'ECharts' }, { label: 'Vue3' }, { label: '2个月' }],
    company: '启元数字科技',
    publisher: '产品总监',
    publishTime: '1小时前发布',
    level: 'SR',
    amount: '32,000',
  },
  {
    title: '跨端营销活动系统重构项目',
    summary: '统一企业营销活动配置平台，支持 H5/小程序/PC 多端投放与数据回流追踪。',
    tags: [{ label: '企业实战' }, { label: 'React' }, { label: 'Node.js' }, { label: '多端' }, { label: '3个月' }],
    company: '新蓝互联',
    publisher: '技术经理',
    publishTime: '3小时前发布',
    level: 'R',
    amount: '26,800',
  },
  {
    title: '制造业排产优化算法平台',
    summary: '面向制造企业构建排产优化平台，结合约束求解与预测模型提升产线利用率。',
    tags: [{ label: '企业实战' }, { label: 'Python' }, { label: '算法优化' }, { label: '工业场景' }, { label: '4个月' }],
    company: '智造未来工业',
    publisher: '算法负责人',
    publishTime: '6小时前发布',
    level: 'SSR',
    amount: '45,500',
  },
  {
    title: '企业官网国际化升级与性能优化',
    summary: '完成企业官网 i18n 改造、SEO 优化与前端性能治理，提升海外访问体验。',
    tags: [{ label: '企业实战' }, { label: 'Next.js' }, { label: '性能优化' }, { label: '国际化' }, { label: '1个月' }],
    company: '海拓国际',
    publisher: '前端架构师',
    publishTime: '昨天发布',
    level: 'N',
    amount: '16,200',
  },
]

// 02）推荐项目类型数据（recommendedTypes）
const recommendedTypes: string[] = ['企业数字化', 'Web开发', '数据分析', 'BI看板', '平台重构', 'Python', '算法优化', '跨端开发']

// 03）推荐企业数据（recommendedCompanies）
const recommendedCompanies: RecommendedCompany[] = [
  { name: '启元数字科技', projects: '76 个企业项目在招' },
  { name: '新蓝互联', projects: '64 个企业项目在招' },
  { name: '智造未来工业', projects: '51 个企业项目在招' },
  { name: '海拓国际', projects: '48 个企业项目在招' },
]

// 04）公告数据（announcements）
const announcements: Announcement[] = [
  { title: '企业实战专项计划第 2 期开启报名', date: '05-26' },
  { title: '新增 12 家企业发布真实项目需求', date: '05-22' },
  { title: '企业项目结项答辩规范更新通知', date: '05-19' },
  { title: '平台联合企业开放线上宣讲专场', date: '05-16' },
]

// 05）企业实战页面组件（EnterprisePracticePage）
/**
 * 函数名：EnterprisePracticePage
 * 功能：渲染企业实战频道页面，展示企业发布的商业项目列表与推荐信息。
 * 实现方法：
 * - 调用 ProjectZonePageLayout 复用首页同款双栏 UI 结构
 * - 注入企业实战项目数据与企业推荐侧栏数据
 * - 保持难度等级与公告区域样式一致，降低用户学习成本
 * 输入：
 * - 无（当前使用静态展示数据）
 * 输出：
 * - 返回值：JSX.Element，企业实战页面结构
 * - 副作用：无
 */
function EnterprisePracticePage() {
  return (
    <ProjectZonePageLayout
      sectionTitle="企业实战"
      searchInputId="enterprise-project-search-input"
      projects={enterpriseProjects}
      recommendedTypes={recommendedTypes}
      recommendedOrganizations={recommendedCompanies}
      announcements={announcements}
      organizationCardTitle="推荐企业"
      organizationActionText="查看更多"
      organizationAvatarText="企"
    />
  )
}

export default EnterprisePracticePage
