import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import GridNoteCard from '../../components/NoteCard/GridNoteCard'
import ProjectCard from '../../components/ProjectCard'
import ProjectLabHeader from '../../components/ProjectChannelLayout/components/ProjectLabHeader'
import TopNavbar from '../../layout/TopNavbar'
import { homePageExperienceNotes, homePageProjects } from './homePageData'
import { useHomePageLayout } from './useHomePageLayout'
import '../../components/ProjectChannelLayout/style.css'
import './HomePage.css'

// 01）首页主组件（HomePage）
/**
 * 函数名：HomePage
 * 功能：按 design.md 渲染 Unibridge 主界面双栏布局（项目实验室大厅 + 经验侧栏）。
 * 实现方法：
 * - 左侧项目实验室：顶栏筛选 + 卡片列表面板 + ProjectCard 列表
 * - 右侧 25% 展示经验笔记侧栏、查看全部链接与撰写引导
 * - 主题色通过 index.css 全局变量驱动
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function HomePage() {
  const { projectBatch, sidebarNoteBatch } = useHomePageLayout({
    projects: homePageProjects,
    sidebarNotes: homePageExperienceNotes,
  })

  const renderedProjectCards = useMemo(() => {
    return projectBatch.map((project) => (
      <ProjectCard key={project.id ?? `${project.title}-${project.ownerName}`} project={project} />
    ))
  }, [projectBatch])

  const renderedSidebarNotes = useMemo(() => {
    return sidebarNoteBatch.map((note) => (
      <GridNoteCard key={`home-sidebar-note-${note.title}`} note={note} />
    ))
  }, [sidebarNoteBatch])

  return (
    <div className="home-page">
      <TopNavbar />

      <main className="home-page__main">
        <section className="home-page__projects" aria-label="项目实验室">
          <div className="home-page__projects-panel">
            <ProjectLabHeader projectTotal={homePageProjects.length} />
            <div className="home-page__projects-list">{renderedProjectCards}</div>
          </div>
        </section>

        <aside className="home-page__insights" aria-label="学生项目复盘与经验">
          <header className="home-page__insights-header">
            <h2 className="home-page__insights-title">项目复盘与经验</h2>
            <Link className="home-page__insights-link" to="/note">
              查看全部 &gt;
            </Link>
          </header>

          {sidebarNoteBatch.length > 0 ? (
            <div className="home-page__note-list">{renderedSidebarNotes}</div>
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
