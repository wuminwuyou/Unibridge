// 01）发布项目页（PublishProjectPage）
import TopNavbar from '../../widgets/top-navbar'

function PublishProjectPage() {
  return <>
    <TopNavbar />
    <div className="detail-page" style={{ paddingTop: '64px' }}>
      <div className="detail-page-main">
        <div className="detail-card"><h2>发布项目</h2>
          <div className="auth-form" style={{ gap: '14px', marginTop: '14px' }}>
            <div className="auth-floating-field has-value"><input type="text" id="project-title" placeholder=" " /><label htmlFor="project-title">项目名称</label></div>
            <div className="auth-floating-field has-value"><textarea id="project-desc" placeholder=" " style={{ width: '100%', minHeight: '200px', borderRadius: '12px', border: '1px solid #dbe3f3', padding: '12px' }} /><label htmlFor="project-desc" style={{ position: 'static' }}>项目描述（Markdown）</label></div>
            <button type="button" className="auth-submit-button">发布项目</button>
          </div>
        </div>
      </div>
    </div>
  </>
}
export default PublishProjectPage
