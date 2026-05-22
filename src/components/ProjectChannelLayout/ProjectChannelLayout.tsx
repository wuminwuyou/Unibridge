import { useMemo } from 'react'
import ProjectCard from '../common/ProjectCard'
import TopNavbar from '../../layout/TopNavbar'
import AnnouncementsCard from './components/AnnouncementsCard'
import ExperienceRecommendationSection from './components/ExperienceRecommendationSection'
import RecommendedCompaniesCard from './components/RecommendedCompaniesCard'
import RecommendedTypesCard from './components/RecommendedTypesCard'
import { projectChannelNavItems } from './constants'
import type { ProjectChannelLayoutModel } from './useProjectChannelLayout'
import type { ProjectChannelLayoutProps } from './types'

// 01）项目频道布局视图参数（ProjectChannelLayoutViewProps）
interface ProjectChannelLayoutViewProps extends ProjectChannelLayoutProps {
  model: ProjectChannelLayoutModel
}

// 02）项目频道布局纯视图（ProjectChannelLayoutView）
/**
 * 函数名：ProjectChannelLayoutView
 * 功能：仅负责项目频道页面的 DOM 结构与子组件拼装，不包含业务状态定义。
 * 实现方法：
 * - 顶部渲染 TopNavbar
 * - 左栏：可选「经验推荐」区 + 「项目列表」区（含「换一换」按钮）
 * - 右栏：推荐类型 / 推荐企业-实验室 / 平台公告 三个侧栏卡
 * 输入：
 * - 见 ProjectChannelLayoutViewProps（合并业务参数与 model）
 * 输出：
 * - 返回值：JSX.Element，频道页整体结构
 * - 副作用：无（事件由 model 内处理器承担）
 */
export function ProjectChannelLayoutView({
  sectionTitle,
  recommendedTypes,
  recommendedOrganizations,
  announcements,
  organizationCardTitle,
  organizationActionText,
  organizationAvatarText,
  model,
}: ProjectChannelLayoutViewProps) {
  // 03）项目卡片渲染缓存（renderedProjectCards）
  const renderedProjectCards = useMemo(() => {
    return model.recommendedProjectBatch.map((project) => (
      <ProjectCard key={`${project.title}-${project.publisher}`} project={project} />
    ))
  }, [model.recommendedProjectBatch])

  return (
    <div className="home-page">
      <TopNavbar navItems={projectChannelNavItems} />

      <main className="home-main">
        <section className="project-section" aria-label={sectionTitle}>
          <ExperienceRecommendationSection
            notes={model.recommendedNoteBatch}
            onRefresh={model.handleRefreshExperienceNotes}
          />

          <div className="section-title-row">
            <h2 className="section-title">{sectionTitle}</h2>
            <button type="button" className="section-refresh-button" onClick={model.handleRefreshProjects}>
              换一换
            </button>
          </div>
          <div className="project-list">{renderedProjectCards}</div>
        </section>

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
      </main>
    </div>
  )
}
