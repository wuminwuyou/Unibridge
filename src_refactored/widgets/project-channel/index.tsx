// 01）项目频道 Widget（project-channel）
// 双栏布局，组合 entities/project/ui/ProjectCard 和筛选功能

function ProjectChannelWidget() {
  return (
    <div className="project-channel-widget">
      <div className="project-channel-widget__main">
        <h2>项目实验室</h2>
        <div className="project-channel-widget__filters">
          <span className="filter-chip active">全部</span>
          <span className="filter-chip">商业项目</span>
          <span className="filter-chip">招募项目</span>
        </div>
        <div className="project-channel-widget__list">
          <p style={{ color: 'var(--text-soft)' }}>项目列表重构中…</p>
        </div>
      </div>
      <aside className="project-channel-widget__sidebar">
        <div className="sidebar-card">推荐类型</div>
        <div className="sidebar-card">平台公告</div>
      </aside>
    </div>
  )
}

export default ProjectChannelWidget
