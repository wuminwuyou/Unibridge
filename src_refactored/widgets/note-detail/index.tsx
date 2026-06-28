// 01）笔记详情 Widget（note-detail）
// 组合 entities/note、features/note-annotation，形成完整阅读区块

function NoteDetailWidget() {
  return (
    <div className="note-detail-widget">
      <div className="note-detail-widget__header">
        <h1>笔记详情</h1>
        <div className="note-detail-widget__meta">
          <span className="note-detail-widget__author">作者</span>
          <span className="note-detail-widget__date">发布时间</span>
        </div>
      </div>
      <div className="note-detail-widget__body">
        <p style={{ color: 'var(--text-soft)' }}>正文内容重构中…</p>
      </div>
      <div className="note-detail-widget__footer">
        <span>学习笔记入口 — 重构中</span>
      </div>
    </div>
  )
}

export default NoteDetailWidget
