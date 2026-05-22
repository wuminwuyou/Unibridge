import ProjectChannelLayout from '../../components/ProjectChannelLayout'
import {
  homePageAnnouncements,
  homePageExperienceNotes,
  homePageProjects,
  homePageRecommendedCompanies,
  homePageRecommendedTypes,
} from './homePageData'

// 01）首页主组件（HomePage）
/**
 * 函数名：HomePage
 * 功能：渲染项目众包平台首页，组合 ProjectChannelLayout 与首页静态数据。
 * 实现方法：
 * - 页面专属数据由同目录 homePageData 维护
 * - 样式由 ProjectChannelLayout 与 TopNavbar 各自加载
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function HomePage() {
  return (
    <ProjectChannelLayout
      sectionTitle="项目专区"
      searchInputId="home-project-search-input"
      projects={homePageProjects}
      experienceRecommendedNotes={homePageExperienceNotes}
      recommendedTypes={homePageRecommendedTypes}
      recommendedOrganizations={homePageRecommendedCompanies}
      announcements={homePageAnnouncements}
      organizationCardTitle="推荐企业"
      organizationActionText="查看更多"
      organizationAvatarText="企"
    />
  )
}

export default HomePage
