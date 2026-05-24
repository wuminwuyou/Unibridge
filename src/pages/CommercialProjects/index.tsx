import { useMemo } from 'react'
import ProjectChannelLayout, { buildCommercialLabFilterTabs } from '../../components/ProjectChannelLayout'
import {
  enterprisePracticeAnnouncements,
  enterprisePracticeProjects,
  enterprisePracticeRecommendedCompanies,
  enterprisePracticeRecommendedTypes,
} from './enterprisePracticePageData'

// 01）企业实战页面组件（CommercialProjectsPage）
/**
 * 函数名：CommercialProjectsPage
 * 功能：渲染企业实战频道页面。
 * 实现方法：
 * - 复用 ProjectChannelLayout
 * - 筛选 Tab 为「全部项目 / 看热门 / 看同地」
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function CommercialProjectsPage() {
  const commercialFilterTabs = useMemo(
    () => buildCommercialLabFilterTabs(enterprisePracticeProjects.length),
    [],
  )

  return (
    <ProjectChannelLayout
      projectsSectionLabel="企业实战"
      projects={enterprisePracticeProjects}
      filterTabs={commercialFilterTabs}
      recommendedTypes={enterprisePracticeRecommendedTypes}
      recommendedOrganizations={enterprisePracticeRecommendedCompanies}
      announcements={enterprisePracticeAnnouncements}
      organizationCardTitle="推荐企业"
      organizationActionText="查看更多"
      organizationAvatarText="企"
    />
  )
}

export default CommercialProjectsPage
