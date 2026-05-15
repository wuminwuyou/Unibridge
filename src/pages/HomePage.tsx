import ProjectZonePageLayout from '../components/home/ProjectZonePageLayout'
import type { Announcement, ProjectItem, RecommendedCompany } from '../components/home/types'
import '../styles/HomePage.css'

// 02）项目卡片数据（projectItems）
const projectItems: ProjectItem[] = [
  {
    title: '基于大模型的智能问答系统开发',
    summary: '构建企业级智能问答平台，支持多知识库接入与权限管理，提升内部知识检索效率。',
    tags: [{ label: 'AI开发' }, { label: '后端管理' }, { label: 'Python' }, { label: '大模型' }, { label: '3个月' }],
    company: '智源科技有限公司',
    publisher: '李经理',
    publishTime: '2小时前发布',
    level: 'R',
    amount: '28,600',
  },
  {
    title: '校园二手交易平台小程序开发',
    summary: '开发一款面向大学生的二手交易平台小程序，包含发布、搜索、聊天、支付等核心功能。',
    tags: [{ label: '小程序' }, { label: 'JavaScript' }, { label: 'UI设计' }, { label: '微信生态' }, { label: '2个月' }],
    company: '校园互联科技',
    publisher: '王老师',
    publishTime: '5小时前发布',
    level: 'SR',
    amount: '15,800',
  },
  {
    title: '数据可视化大屏设计与开发',
    summary: '为企业管理后台设计数据可视化大屏，整合多源数据，提供直观的业务展示与分析能力。',
    tags: [{ label: '数据可视化' }, { label: 'Vue.js' }, { label: 'ECharts' }, { label: '大屏设计' }, { label: '1个月' }],
    company: '数智未来科技',
    publisher: '陈总监',
    publishTime: '1天前发布',
    level: 'SSR',
    amount: '22,400',
  },
  {
    title: '企业官网重构设计',
    summary: '为企业重新设计官网，提升品牌形象与用户体验，支持多终端适配与内容管理。',
    tags: [{ label: 'Web设计' }, { label: '品牌化设计' }, { label: '前端开发' }, { label: '3个月' }],
    company: '创新互联有限公司',
    publisher: '张设计',
    publishTime: '2天前发布',
    level: 'N',
    amount: '18,900',
  },
  {
    title: '基于机器学习的销售预测系统',
    summary: '利用机器学习算法构建销售预测模型，帮助企业优化库存与销售策略。',
    tags: [{ label: '机器学习' }, { label: 'Python' }, { label: '数据分析' }, { label: '预测建模' }, { label: '4个月' }],
    company: '睿云数据科技',
    publisher: '刘博士',
    publishTime: '3天前发布',
    level: 'UR',
    amount: '36,500',
  },
]

// 03）推荐项目类型数据（recommendedTypes）
const recommendedTypes: string[] = ['AI', 'Web开发', '小程序', '数据分析', 'UI设计', 'Python', '移动开发', '游戏开发']

// 04）推荐企业数据（recommendedCompanies）
const recommendedCompanies: RecommendedCompany[] = [
  { name: '智源科技有限公司', projects: '156 个项目在招' },
  { name: '数智未来科技', projects: '128 个项目在招' },
  { name: '跃新互联有限公司', projects: '98 个项目在招' },
  { name: '云创未来科技', projects: '86 个项目在招' },
]

// 05）公告数据（announcements）
const announcements: Announcement[] = [
  { title: '2024 年度优秀项目评选活动正式启动', date: '05-20' },
  { title: '第六期企业实战项目征集进行中', date: '05-18' },
  { title: '高校合作计划新增 10 所合作院校', date: '05-15' },
  { title: '平台功能升级公告', date: '05-12' },
]

// 06）首页主组件（HomePage）
/**
 * 函数名：HomePage
 * 功能：渲染项目众包平台首页，负责组合顶部导航、项目流与侧边栏复用组件。
 * 实现方法：
 * - 调用 ProjectZonePageLayout 复用项目专区通用双栏结构
 * - 传入首页项目、推荐类型、推荐企业与公告数据
 * - 通过参数控制页面标题与搜索输入框标识
 * 输入：
 * - 无（当前版本使用本地静态数据）
 * 输出：
 * - 返回值：JSX.Element，平台首页结构
 * - 副作用：无
 */
function HomePage() {
  return (
    <ProjectZonePageLayout
      sectionTitle="项目专区"
      searchInputId="home-project-search-input"
      projects={projectItems}
      recommendedTypes={recommendedTypes}
      recommendedOrganizations={recommendedCompanies}
      announcements={announcements}
      organizationCardTitle="推荐企业"
      organizationActionText="查看更多"
      organizationAvatarText="企"
    />
  )
}

export default HomePage
