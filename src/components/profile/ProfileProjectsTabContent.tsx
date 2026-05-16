import ProjectCard from '../common/ProjectCard'
import type { ProjectItem } from '../home/types'

// 01）项目Tab内容组件参数类型（ProfileProjectsTabContentProps）
interface ProfileProjectsTabContentProps {
  isLoading: boolean
  projects: ProjectItem[]
}

// 02）个人空间项目Tab内容组件（ProfileProjectsTabContent）
/**
 * 函数名：ProfileProjectsTabContent
 * 功能：渲染个人空间“项目”Tab 的加载态与项目列表内容。
 * 实现方法：
 * - 根据 isLoading 条件显示 1000ms 延迟加载提示
 * - 加载完成后使用 ProjectCard 统一渲染项目列表
 * - 输出项目 Tab 专用容器类名，复用现有动画与布局样式
 * 输入：
 * - isLoading：是否处于加载状态
 * - projects：项目数据列表
 * 输出：
 * - 返回值：JSX.Element，项目 Tab 内容结构
 * - 副作用：无
 */
function ProfileProjectsTabContent({ isLoading, projects }: ProfileProjectsTabContentProps) {
  return (
    <article className="profile-section-card">
      <header className="profile-section-card__head">
        <h2>项目</h2>
      </header>
      {isLoading ? (
        <div className="profile-project-loading" aria-live="polite">
          <span className="profile-project-loading__spinner" aria-hidden="true" />
          <p>正在加载项目数据...</p>
        </div>
      ) : (
        <div className="profile-project-tab-list">
          {projects.map((project) => (
            <ProjectCard key={`${project.title}-${project.publishTime}`} project={project} />
          ))}
        </div>
      )}
    </article>
  )
}

export default ProfileProjectsTabContent
