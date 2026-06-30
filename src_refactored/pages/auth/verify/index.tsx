// 01）实名认证页（VerificationPage）
import TopNavbar from '@widgets/top-navbar'

function VerificationPage() {
  return (
    <>
      <TopNavbar />
      <div className="detail-page" style={{ paddingTop: '64px' }}>
        <div className="detail-page-main" style={{ maxWidth: '560px', margin: '40px auto' }}>
          <div className="detail-card">
            <h2>实名认证</h2>
            <p style={{ color: 'var(--text-soft)', margin: '12px 0' }}>完成实名认证以解锁更多功能。</p>
            <div className="auth-form" style={{ gap: '14px' }}>
              <div className="auth-floating-field has-value">
                <input type="text" id="verify-name" placeholder=" " />
                <label htmlFor="verify-name">真实姓名</label>
              </div>
              <div className="auth-floating-field has-value">
                <input type="text" id="verify-id" placeholder=" " />
                <label htmlFor="verify-id">身份证号</label>
              </div>
              <button type="button" className="auth-submit-button">提交认证</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default VerificationPage
