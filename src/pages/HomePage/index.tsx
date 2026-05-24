import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import GridNoteCard from '../../components/NoteCard/GridNoteCard'
import ProjectCard from '../../components/ProjectCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ProjectLabHeader from '../../components/ProjectChannelLayout/components/ProjectLabHeader'
import TopNavbar from '../../layout/TopNavbar'
import { useHomeFeedData } from '../../api/feed/useHomeFeedData'
import '../../components/ProjectChannelLayout/style.css'
import './HomePage.css'

// 01）首页主组件（HomePage）
/**
 * 函数名：HomePage
 * 功能：按 design.md 渲染 Unibridge 主界面双栏布局（项目实验室大厅 + 经验侧栏）。
 * 实现方法：
 * - 调用 GET /feed/home 获取项目与笔记推荐
 * - 左侧项目实验室：顶栏筛选 + 卡片列表面板 + ProjectCard 列表
 * - 右侧 25% 展示经验笔记侧栏、查看全部链接与撰写引导
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：发起网络请求
 */
function HomePage() {
  const { loadState, errorMessage, projects, notes } = useHomeFeedData()

  const renderedProjectCards = useMemo(() => {
    return projects.map((project) => (
      <ProjectCard key={project.uid ?? project.title} project={project} />
    ))
  }, [projects])

  const renderedSidebarNotes = useMemo(() => {
    return notes.map((note) => (
      <GridNoteCard key={note.uid ?? note.title} note={note} />
    ))
  }, [notes])

  return (
    <div className="home-page">
      <TopNavbar />

      <main className="home-page__main">
        <section className="home-page__projects" aria-label="项目实验室">
          <div className="home-page__projects-panel">
            <ProjectLabHeader projectTotal={projects.length} />

            {loadState === 'loading' ? (
              <div className="home-page__feed-status">
                <LoadingSpinner size={32} label="正在加载推荐项目…" />
              </div>
            ) : null}

            {loadState === 'error' ? (
              <p className="home-page__feed-status home-page__feed-status--error" role="alert">
                {errorMessage ?? '加载推荐项目失败，请稍后重试'}
              </p>
            ) : null}

            {loadState === 'ready' ? (
              <div className="home-page__projects-list">{renderedProjectCards}</div>
            ) : null}
          </div>
        </section>

        <aside className="home-page__insights" aria-label="学生项目复盘与经验">
          <header className="home-page__insights-header">
            <h2 className="home-page__insights-title">项目复盘与经验</h2>
            <Link className="home-page__insights-link" to="/note">
              查看全部 &gt;
            </Link>
          </header>

          {loadState === 'loading' ? (
            <div className="home-page__feed-status">
              <LoadingSpinner size={24} label="正在加载经验笔记…" />
            </div>
          ) : null}

          {loadState === 'ready' && notes.length > 0 ? (
            <div className="home-page__note-list">{renderedSidebarNotes}</div>
          ) : null}

          {loadState === 'ready' && notes.length === 0 ? (
            <p className="home-page__feed-status">暂无推荐笔记</p>
          ) : null}

          <Link className="home-page__compose-trigger" to="/publish/note">
            📝 写下你的项目经验
          </Link>
        </aside>
      </main>
    </div>
  )
}

export default HomePage
