import ProjectChannelLayout from '../../components/ProjectChannelLayout'
import {
  campusRecruitAnnouncements,
  campusRecruitProjects,
  campusRecruitRecommendedLabs,
  campusRecruitRecommendedTypes,
} from './campusRecruitPageData'

// 01）高校招募页面组件（CampusRecruitPage）
/**
 * 函数名：CampusRecruitPage
 * 功能：渲染高校招募频道页面。
 * 实现方法：
 * - 复用 ProjectChannelLayout
 * - 右侧栏展示推荐本校实验室
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function CampusRecruitPage() {
  return (
    <ProjectChannelLayout
      sectionTitle="高校招募"
      searchInputId="campus-recruit-search-input"
      projects={campusRecruitProjects}
      recommendedTypes={campusRecruitRecommendedTypes}
      recommendedOrganizations={campusRecruitRecommendedLabs}
      announcements={campusRecruitAnnouncements}
      organizationCardTitle="推荐本校实验室"
      organizationActionText="查看更多"
      organizationAvatarText="校"
    />
  )
}

export default CampusRecruitPage
