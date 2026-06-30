// 01）首页流 Widget（HomeFeedWidget）
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { NOTES_CREATE_PATH, NOTES_LIST_PATH } from '@shared/lib/noteRoutes'
import ProjectCard from '../../entities/project/ui/ProjectCard'
import GridNoteCard from '../../entities/note/ui/GridNoteCard'
import LoadingSpinner from '../../shared/ui/LoadingSpinner'
import ProjectLabHeader from '../../features/feed-filter/ui/ProjectLabHeader'
import { useHomeFeedWidget } from './hooks/useHomeFeedWidget'
import './HomeFeedLayout.css'

function HomeFeedWidget() {
  const { loadState, errorMessage, projects, notes } = useHomeFeedWidget()

  const renderedProjectCards = useMemo(() => projects.map((p) => <ProjectCard key={p.uid ?? p.title} project={p} />), [projects])
  const renderedSidebarNotes = useMemo(() => notes.map((n) => <GridNoteCard key={n.uid ?? n.title} note={n} />), [notes])

  return (
    <main className="home-page__main">
      <section className="home-page__projects" aria-label="项目实验室">
        <div className="home-page__projects-panel">
          <ProjectLabHeader projectTotal={projects.length} />
          {loadState === 'loading' ? <div className="home-page__feed-status"><LoadingSpinner size={32} label="正在加载推荐项目…" /></div>
            : loadState === 'error' ? <p className="home-page__feed-status home-page__feed-status--error" role="alert">{errorMessage ?? '加载推荐项目失败，请稍后重试'}</p>
              : <div className="home-page__projects-list">{renderedProjectCards}</div>}
        </div>
      </section>
      <aside className="home-page__insights" aria-label="学生项目复盘与经验">
        <header className="home-page__insights-header">
          <h2 className="home-page__insights-title">项目复盘与经验</h2>
          <Link className="home-page__insights-link" to={NOTES_LIST_PATH}>查看全部 &gt;</Link>
        </header>
        {loadState === 'loading' ? <div className="home-page__feed-status"><LoadingSpinner size={24} label="正在加载经验笔记…" /></div>
          : loadState === 'ready' && notes.length > 0 ? <div className="home-page__note-list">{renderedSidebarNotes}</div>
            : loadState === 'ready' && notes.length === 0 ? <p className="home-page__feed-status">暂无推荐笔记</p> : null}
        <Link className="home-page__compose-trigger" to={NOTES_CREATE_PATH}>📝 写下你的项目经验</Link>
      </aside>
    </main>
  )
}

export default HomeFeedWidget
