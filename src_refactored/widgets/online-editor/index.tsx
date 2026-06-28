// 01）在线编辑器 Widget（online-editor）
// 组合 entities/editor 的 MilkdownWrapper / MarkdownEditor

function OnlineEditorWidget() {
  return (
    <div className="online-editor-widget">
      <div className="online-editor-widget__toolbar">
        <span className="toolbar-btn">粗体</span>
        <span className="toolbar-btn">标题</span>
        <span className="toolbar-btn">代码</span>
      </div>
      <div className="online-editor-widget__editor">
        <p style={{ color: 'var(--text-soft)' }}>编辑器重构中…</p>
      </div>
    </div>
  )
}

export default OnlineEditorWidget
