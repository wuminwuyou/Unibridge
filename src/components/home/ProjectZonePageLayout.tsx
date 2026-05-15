import ProjectCard from './ProjectCard'
import {
  AnnouncementsCard,
  RecommendedCompaniesCard,
  RecommendedTypesCard,
  SearchSidebarCard,
} from './SidebarCards'
import TopNavbar from '../layout/TopNavbar'
import type { Announcement, ProjectItem, RecommendedCompany } from './types'

// 01）项目专区通用布局参数类型（ProjectZonePageLayoutProps）
interface ProjectZonePageLayoutProps {
  sectionTitle: string
  searchInputId: string
  projects: ProjectItem[]
  recommendedTypes: string[]
  recommendedOrganizations: RecommendedCompany[]
  announcements: Announcement[]
  organizationCardTitle?: string
  organizationActionText?: string
  organizationAvatarText?: string
}

// 02）顶部导航数据（navItems）
const navItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 03）项目专区通用布局组件（ProjectZonePageLayout）
/**
 * 函数名：ProjectZonePageLayout
 * 功能：渲染首页/企业实战/高校招募三类页面共用的项目列表双栏布局。
 * 实现方法：
 * - 复用 TopNavbar 渲染统一顶部导航
 * - 左侧按项目数组渲染 ProjectCard 列表流
 * - 右侧复用搜索、类型、组织推荐、公告四块侧栏卡片
 * - 通过可选参数切换组织推荐卡片标题与头像文案
 * 输入：
 * - sectionTitle：左侧内容区标题
 * - searchInputId：搜索输入框唯一 id
 * - projects：项目数据数组
 * - recommendedTypes：推荐类型标签数组
 * - recommendedOrganizations：推荐组织列表（企业或实验室）
 * - announcements：公告数据数组
 * - organizationCardTitle：组织推荐卡片标题，可选
 * - organizationActionText：组织推荐卡片右上角文案，可选
 * - organizationAvatarText：组织列表头像文字，可选
 * 输出：
 * - 返回值：JSX.Element，完整项目专区页面结构
 * - 副作用：无
 */
function ProjectZonePageLayout({
  sectionTitle,
  searchInputId,
  projects,
  recommendedTypes,
  recommendedOrganizations,
  announcements,
  organizationCardTitle,
  organizationActionText,
  organizationAvatarText,
}: ProjectZonePageLayoutProps) {
  return (
    <div className="home-page">
      <TopNavbar navItems={navItems} />

      <main className="home-main">
        <section className="project-section" aria-label={sectionTitle}>
          <h2 className="section-title">{sectionTitle}</h2>
          <div className="project-list">
            {projects.map((project) => (
              <ProjectCard key={`${project.title}-${project.publisher}`} project={project} />
            ))}
          </div>
        </section>

        <aside className="sidebar" aria-label="右侧信息栏">
          <SearchSidebarCard inputId={searchInputId} />
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

export default ProjectZonePageLayout
