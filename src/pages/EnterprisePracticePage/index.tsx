import ProjectChannelLayout from '../../components/ProjectChannelLayout'
import {
  enterprisePracticeAnnouncements,
  enterprisePracticeProjects,
  enterprisePracticeRecommendedCompanies,
  enterprisePracticeRecommendedTypes,
} from './enterprisePracticePageData'

// 01）企业实战页面组件（EnterprisePracticePage）
/**
 * 函数名：EnterprisePracticePage
 * 功能：渲染企业实战频道页面。
 * 实现方法：
 * - 复用 ProjectChannelLayout
 * - 数据由同目录 enterprisePracticePageData 提供
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element
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
