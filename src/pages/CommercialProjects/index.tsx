import { useMemo } from 'react'
import { useProjectFeedData } from '../../api/feed/useProjectFeedData'
import ProjectChannelLayout, { buildCommercialLabFilterTabs } from '../../components/ProjectChannelLayout'
import {
  enterprisePracticeAnnouncements,
  enterprisePracticeRecommendedCompanies,
  enterprisePracticeRecommendedTypes,
} from './enterprisePracticePageData'

// 01）企业实战页面组件（CommercialProjectsPage）
/**
 * 函数名：CommercialProjectsPage
 * 功能：渲染企业实战频道页面，项目列表来自 GET /feed/projects?category=COMMERCIAL。
 * 实现方法：
 * - 复用 ProjectChannelLayout
 * - 筛选 Tab 为「全部项目 / 看热门 / 看同地」
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：发起网络请求
 */
function CommercialProjectsPage() {
  const { loadState, errorMessage, projects } = useProjectFeedData({ category: 'COMMERCIAL' })

  const commercialFilterTabs = useMemo(
    () => buildCommercialLabFilterTabs(projects.length),
    [projects.length],
  )

  return (
    <ProjectChannelLayout
      projectsSectionLabel="企业实战"
      projects={projects}
      feedLoadState={loadState}
      feedErrorMessage={errorMessage}
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
