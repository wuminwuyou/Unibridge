// 01）404 未找到页（NotFoundPage）
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="detail-page">
      <div className="detail-page-main" style={{ textAlign: 'center', paddingTop: '120px' }}>
        <h1 style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}>404</h1>
        <p style={{ fontSize: '16px', color: 'var(--text-soft)', marginBottom: '24px' }}>页面未找到</p>
        <Link to="/" style={{ color: 'var(--primary-text)', textDecoration: 'underline' }}>返回首页</Link>
      </div>
    </div>
  )
}
export default NotFoundPage
