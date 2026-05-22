import RowNoteCard from '../../../components/common/RowNoteCard'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import ProjectCard from '../../../components/common/ProjectCard'
import { useProfileHomeData } from './useProfileHomeData'
import './ProfileHomeTabContent.css'

// 01）主页内容组件参数类型（ProfileHomeTabContentProps）
interface ProfileHomeTabContentProps {
  onViewAllProjects: () => void
  onViewAllNotes: () => void
}

// 02）个人空间主页内容组件（ProfileHomeTabContent）
/**
 * 函数名：ProfileHomeTabContent
 * 功能：渲染个人空间「主页」Tab 下的项目区与笔记区内容。
 * 实现方法：
 * - 挂载时调用 GET /user-profile/home 获取预览列表
 * - 使用 ProjectCard、RowNoteCard 渲染数据
 * - 加载中与错误态分别展示 LoadingSpinner 与提示文案
 * 输入：
 * - onViewAllProjects：点击「我的项目-查看全部」时的跳转处理函数
 * - onViewAllNotes：点击「我的笔记-查看全部」时的跳转处理函数
 * 输出：
 * - 返回值：JSX.Element，主页 Tab 内容结构
 * - 副作用：发起网络请求
 */
function ProfileHomeTabContent({ onViewAllProjects, onViewAllNotes }: ProfileHomeTabContentProps) {
  const { loadState, errorMessage, projects, notes, projectTotal, noteTotal } = useProfileHomeData()

  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载主页内容…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载主页内容失败，请稍后重试'}
      </p>
    )
  }

  const projectViewAllLabel =
    projectTotal != null && projectTotal > projects.length ? `查看全部（${projectTotal}）` : '查看全部'
  const noteViewAllLabel =
    noteTotal != null && noteTotal > notes.length ? `查看全部（${noteTotal}）` : '查看全部'

  return (
    <>
      <article className="profile-section-card">
        <header className="profile-section-card__head">
          <h2>我的项目</h2>
          <button type="button" onClick={onViewAllProjects}>
            {projectViewAllLabel}
          </button>
        </header>
        <div className="profile-project-grid">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard key={`${project.title}-${project.publishTime}`} project={project} />
            ))
          ) : (
            <p className="profile-tab-empty">暂无项目内容</p>
          )}
        </div>
      </article>

      <article className="profile-section-card">
        <header className="profile-section-card__head">
          <h2>我的笔记</h2>
          <button type="button" onClick={onViewAllNotes}>
            {noteViewAllLabel}
          </button>
        </header>
        <div className="profile-note-list">
          {notes.length > 0 ? (
            notes.map((note) => <RowNoteCard key={note.title} note={note} />)
          ) : (
            <p className="profile-tab-empty">暂无笔记内容</p>
          )}
        </div>
      </article>
    </>
  )
}

export default ProfileHomeTabContent
