import ProjectCard from '../../../../components/ProjectCard'
import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import { useProfileProjectsData } from './useProfileProjectsData'
import './ProfileProjectsTabContent.css'

// 01）个人空间项目Tab内容组件（ProfileProjectsTabContent）
/**
 * 函数名：ProfileProjectsTabContent
 * 功能：渲染个人空间「项目」Tab 的加载态与项目列表内容。
 * 实现方法：
 * - 挂载时调用 GET /user-profile/projects 拉取列表
 * - 加载中展示 LoadingSpinner，完成后用 ProjectCard 渲染
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element，项目 Tab 内容结构
 * - 副作用：发起网络请求
 */
function ProfileProjectsTabContent() {
  const { loadState, errorMessage, projects, total } = useProfileProjectsData()

  return (
    <article className="profile-section-card">
      <header className="profile-section-card__head">
        <h2>项目{total != null ? `（${total}）` : ''}</h2>
      </header>
      {loadState === 'loading' ? (
        <div className="profile-project-loading" aria-live="polite">
          <LoadingSpinner size={32} label="正在加载项目数据…" />
        </div>
      ) : null}
      {loadState === 'error' ? (
        <p className="profile-tab-status profile-tab-status--error" role="alert">
          {errorMessage ?? '加载项目列表失败，请稍后重试'}
        </p>
      ) : null}
      {loadState === 'ready' ? (
        <div className="profile-project-tab-list">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard key={`${project.title}-${project.publishTime}`} project={project} />
            ))
          ) : (
            <p className="profile-tab-empty">暂无项目内容</p>
          )}
        </div>
      ) : null}
    </article>
  )
}

export default ProfileProjectsTabContent
