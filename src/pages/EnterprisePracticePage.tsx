import ProjectChannelLayout from '../components/ProjectChannelLayout'
import {
  enterprisePracticeAnnouncements,
  enterprisePracticeProjects,
  enterprisePracticeRecommendedCompanies,
  enterprisePracticeRecommendedTypes,
} from '../data/enterprisePracticePageData'
import '../styles/HomePage.css'

// 01）企业实战页面组件（EnterprisePracticePage）
/**
 * 函数名：EnterprisePracticePage
 * 功能：渲染企业实战频道页面，展示企业发布的商业项目列表与推荐信息。
 * 实现方法：
 * - 通过 ProjectChannelLayout 复用项目频道双栏布局
 * - 静态展示数据从 src/data/enterprisePracticePageData 引入
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element，企业实战页面结构
 * - 副作用：无
 */
function EnterprisePracticePage() {
  return (
    <ProjectChannelLayout
      sectionTitle="企业实战"
      searchInputId="enterprise-project-search-input"
      projects={enterprisePracticeProjects}
      recommendedTypes={enterprisePracticeRecommendedTypes}
      recommendedOrganizations={enterprisePracticeRecommendedCompanies}
      announcements={enterprisePracticeAnnouncements}
      organizationCardTitle="推荐企业"
      organizationActionText="查看更多"
      organizationAvatarText="企"
    />
  )
}

export default EnterprisePracticePage
