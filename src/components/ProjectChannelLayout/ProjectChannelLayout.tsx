import { useMemo } from 'react'
import ProjectCard from '../ProjectCard'
import LoadingSpinner from '../common/LoadingSpinner'
import TopNavbar from '../../layout/TopNavbar'
import AnnouncementsCard from './components/AnnouncementsCard'
import ProjectLabHeader from './components/ProjectLabHeader'
import RecommendedCompaniesCard from './components/RecommendedCompaniesCard'
import RecommendedTypesCard from './components/RecommendedTypesCard'
import type { ProjectChannelLayoutProps } from './types'

// 01）项目频道布局纯视图（ProjectChannelLayoutView）
/**
 * 函数名：ProjectChannelLayoutView
 * 功能：项目频道页面的 DOM 结构与子组件拼装，布局对齐首页项目实验室双栏结构。
 * 实现方法：
 * - 左侧：项目实验室面板（ProjectLabHeader + ProjectCard 列表）
 * - 右侧：推荐类型、推荐组织与平台公告侧栏
 * 输入：
 * - 见 ProjectChannelLayoutProps
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
export function ProjectChannelLayoutView({
  projectsSectionLabel,
  projects,
  feedLoadState = 'ready',
  feedErrorMessage,
  labTitle,
  labSubtitle,
  filterTabs,
  recommendedTypes,
  recommendedOrganizations,
  announcements,
  organizationCardTitle,
  organizationActionText,
  organizationAvatarText,
}: ProjectChannelLayoutProps) {
  const renderedProjectCards = useMemo(() => {
    return projects.map((project) => (
      <ProjectCard key={project.uid ?? project.title} project={project} />
    ))
  }, [projects])

  return (
    <div className="home-page">
      <TopNavbar />

      <main className="home-page__main">
        <section className="home-page__projects" aria-label={projectsSectionLabel}>
          <div className="home-page__projects-panel">
            <ProjectLabHeader
              projectTotal={projects.length}
              labTitle={labTitle}
              labSubtitle={labSubtitle}
              filterTabs={filterTabs}
            />

            {feedLoadState === 'loading' ? (
              <div className="home-page__feed-status">
                <LoadingSpinner size={32} label="正在加载推荐项目…" />
              </div>
            ) : null}

            {feedLoadState === 'error' ? (
              <p className="home-page__feed-status home-page__feed-status--error" role="alert">
                {feedErrorMessage ?? '加载推荐项目失败，请稍后重试'}
              </p>
            ) : null}

            {feedLoadState === 'ready' ? (
              <div className="home-page__projects-list">{renderedProjectCards}</div>
            ) : null}
          </div>
        </section>

        <aside className="project-channel-layout__sidebar" aria-label="右侧信息栏">
          <RecommendedTypesCard types={recommendedTypes} />
          <RecommendedCompaniesCard
            companies={recommendedOrganizations}
            title={organizationCardTitle}
            actionText={organizationActionText}
            avatarText={organizationAvatarText}
          />
          <AnnouncementsCard announcements={announcements} />
        </aside>
      </main>
    </div>
  )
}
