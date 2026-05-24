import { useMemo } from 'react'
import ProjectCard from '../ProjectCard'
import TopNavbar from '../../layout/TopNavbar'
import AnnouncementsCard from './components/AnnouncementsCard'
import ExperienceRecommendationSection from './components/ExperienceRecommendationSection'
import RecommendedCompaniesCard from './components/RecommendedCompaniesCard'
import RecommendedTypesCard from './components/RecommendedTypesCard'
import type { ProjectChannelLayoutModel } from './useProjectChannelLayout'
import type { ProjectChannelLayoutProps } from './types'

// 01）项目频道布局视图参数（ProjectChannelLayoutViewProps）
interface ProjectChannelLayoutViewProps extends ProjectChannelLayoutProps {
  model: ProjectChannelLayoutModel
}

// 02）项目频道布局纯视图（ProjectChannelLayoutView）
/**
 * 函数名：ProjectChannelLayoutView
 * 功能：项目频道页面的 DOM 结构与子组件拼装。
 * 实现方法：
 * - default：左栏（经验推荐 + 项目列表）+ 右栏侧栏卡
 * - stacked（HomePage）：上栏笔记专区全宽 + 下栏项目专区（主区 + 固定宽 aside）
 * 输入：
 * - 见 ProjectChannelLayoutViewProps
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
export function ProjectChannelLayoutView({
  sectionTitle,
  layout = 'default',
  notesSectionTitle = '经验推荐',
  recommendedTypes,
  recommendedOrganizations,
  announcements,
  organizationCardTitle,
  organizationActionText,
  organizationAvatarText,
  model,
}: ProjectChannelLayoutViewProps) {
  const renderedProjectCards = useMemo(() => {
    return model.recommendedProjectBatch.map((project) => (
      <ProjectCard key={project.id ?? `${project.title}-${project.ownerName}`} project={project} />
    ))
  }, [model.recommendedProjectBatch])

  const projectListSection = (
    <>
      <div className="section-title-row">
        <h2 className="section-title">{sectionTitle}</h2>
        <button type="button" className="section-refresh-button" onClick={model.handleRefreshProjects}>
          换一换
        </button>
      </div>
      <div className="project-list">{renderedProjectCards}</div>
    </>
  )

  const sidebar = (
    <aside className="sidebar" aria-label="右侧信息栏">
      <RecommendedTypesCard types={recommendedTypes} />
      <RecommendedCompaniesCard
        companies={recommendedOrganizations}
        title={organizationCardTitle}
        actionText={organizationActionText}
        avatarText={organizationAvatarText}
      />
      <AnnouncementsCard announcements={announcements} />
    </aside>
  )

  const notesSection = (
    <ExperienceRecommendationSection
      notes={model.recommendedNoteBatch}
      onRefresh={model.handleRefreshExperienceNotes}
      sectionTitle={notesSectionTitle}
    />
  )

  const isStackedLayout = layout === 'stacked'

  return (
    <div className="home-page">
      <TopNavbar />

      <main className={`home-main ${isStackedLayout ? 'home-main--stacked' : ''}`.trim()}>
        {isStackedLayout ? (
          <>
            <section className="home-notes-zone" aria-label={notesSectionTitle}>
              {notesSection}
            </section>

            <section className="home-projects-zone" aria-label={sectionTitle}>
              <div className="home-projects-zone__inner">
                <div className="project-section">{projectListSection}</div>
                {sidebar}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="project-section" aria-label={sectionTitle}>
              {notesSection}
              {projectListSection}
            </section>
            {sidebar}
          </>
        )}
      </main>
    </div>
  )
}
