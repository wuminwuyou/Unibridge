// 01）发布笔记页（PublishNotePage）
import TopNavbar from '@widgets/top-navbar'

function PublishNotePage() {
  return <>
    <TopNavbar />
    <div className="detail-page" style={{ paddingTop: '64px' }}>
      <div className="detail-page-main">
        <div className="detail-card"><h2>发布笔记</h2>
          <div className="auth-form" style={{ gap: '14px', marginTop: '14px' }}>
            <div className="auth-floating-field has-value"><input type="text" id="note-title" placeholder=" " /><label htmlFor="note-title">笔记标题</label></div>
            <div className="auth-floating-field has-value"><textarea id="note-content" placeholder=" " style={{ width: '100%', minHeight: '200px', borderRadius: '12px', border: '1px solid #dbe3f3', padding: '12px' }} /><label htmlFor="note-content" style={{ position: 'static' }}>正文内容（Markdown）</label></div>
            <button type="button" className="auth-submit-button">发布笔记</button>
          </div>
        </div>
      </div>
    </div>
  </>
}
export default PublishNotePage
