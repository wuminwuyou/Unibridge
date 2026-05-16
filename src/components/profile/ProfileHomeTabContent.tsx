import RowNoteCard from '../common/RowNoteCard'
import ProjectCard from '../common/ProjectCard'
import type { ProjectItem } from '../home/types'
import type { ProfileNoteItem } from './types'

// 01）主页内容组件参数类型（ProfileHomeTabContentProps）
interface ProfileHomeTabContentProps {
  projects: ProjectItem[]
  notes: ProfileNoteItem[]
  onViewAllProjects: () => void
  onViewAllNotes: () => void
}

// 02）个人空间主页内容组件（ProfileHomeTabContent）
/**
 * 函数名：ProfileHomeTabContent
 * 功能：渲染个人空间“主页”Tab 下的项目区与笔记区内容。
 * 实现方法：
 * - 使用 ProjectCard 渲染项目区，复用现有项目卡片能力
 * - 根据 notes 数据渲染笔记列表卡片与元信息
 * - 输出与页面样式类一致的结构，便于统一维护样式
 * 输入：
 * - projects：项目列表数据
 * - notes：笔记列表数据
 * - onViewAllProjects：点击“我的项目-查看全部”时的跳转处理函数
 * - onViewAllNotes：点击“我的笔记-查看全部”时的跳转处理函数
 * 输出：
 * - 返回值：JSX.Element，主页 Tab 内容结构
 * - 副作用：无
 */
function ProfileHomeTabContent({ projects, notes, onViewAllProjects, onViewAllNotes }: ProfileHomeTabContentProps) {
  return (
    <>
      <article className="profile-section-card">
        <header className="profile-section-card__head">
          <h2>我的项目</h2>
          <button type="button" onClick={onViewAllProjects}>
            查看全部
          </button>
        </header>
        <div className="profile-project-grid">
          {projects.map((project) => (
            <ProjectCard key={`${project.title}-${project.publishTime}`} project={project} />
          ))}
        </div>
      </article>

      <article className="profile-section-card">
        <header className="profile-section-card__head">
          <h2>我的笔记</h2>
          <button type="button" onClick={onViewAllNotes}>
            查看全部
          </button>
        </header>
        <div className="profile-note-list">
          {notes.map((note) => (
            <RowNoteCard key={note.title} note={note} />
          ))}
        </div>
      </article>
    </>
  )
}

export default ProfileHomeTabContent
