// 01）项目详情 Widget（project-detail）
// 组合 entities/project 的展示组件

function ProjectDetailWidget() {
  return (
    <div className="project-detail-widget">
      <div className="project-detail-widget__header">
        <h1>项目详情</h1>
        <div className="project-detail-widget__tags">
          <span className="tag">技术标签</span>
        </div>
      </div>
      <div className="project-detail-widget__body">
        <p style={{ color: 'var(--text-soft)' }}>项目正文重构中…</p>
      </div>
    </div>
  )
}

export default ProjectDetailWidget
