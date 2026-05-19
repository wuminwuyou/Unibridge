import ProjectChannelLayout from '../components/ProjectChannelLayout'
import {
  campusRecruitAnnouncements,
  campusRecruitProjects,
  campusRecruitRecommendedLabs,
  campusRecruitRecommendedTypes,
} from '../data/campusRecruitPageData'
import '../styles/HomePage.css'

// 01）高校招募页面组件（CampusRecruitPage）
/**
 * 函数名：CampusRecruitPage
 * 功能：渲染高校招募频道页面，展示实验室项目与招新信息。
 * 实现方法：
 * - 通过 ProjectChannelLayout 复用项目频道双栏布局
 * - 静态展示数据从 src/data/campusRecruitPageData 引入
 * - 将右侧"推荐企业"替换为"推荐本校实验室"
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element，高校招募页面结构
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
