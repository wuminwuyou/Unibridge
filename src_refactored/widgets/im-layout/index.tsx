// 01）IM 三栏布局 Widget（im-layout）
// 组合 entities/message 和 features/im-interaction

function ImLayoutWidget() {
  return (
    <div className="im-layout-widget">
      <nav className="im-layout-widget__domain-bar">
        <div className="domain-item active">团队</div>
        <div className="domain-item">项目</div>
        <div className="domain-item">通知</div>
      </nav>
      <nav className="im-layout-widget__channel-panel">
        <div className="channel-item">对话 1</div>
        <div className="channel-item">对话 2</div>
      </nav>
      <main className="im-layout-widget__chat-view">
        <p style={{ color: 'var(--text-soft)' }}>聊天区域重构中…</p>
      </main>
    </div>
  )
}

export default ImLayoutWidget
