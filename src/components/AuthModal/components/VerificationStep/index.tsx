import '../../style.css'
import type { VerificationGuideTab } from '../../types'

// 01）身份认证引导视图参数（VerificationStepProps）
interface VerificationStepProps {
  verificationTab: VerificationGuideTab
  eduMailbox: string
  eduMailboxMatched: boolean
  onVerificationTabChange: (tab: VerificationGuideTab) => void
  onEduMailboxChange: (value: string) => void
  onBackToAuthForm: () => void
}

// 02）身份认证引导视图（VerificationStep）
/**
 * 函数名：VerificationStep
 * 功能：登录成功后的身份认证引导（教育邮箱与证件上传占位）。
 * 实现方法：
 * - Tab 切换两种方式
 * - .edu.cn 智能提示由 eduMailboxMatched 驱动
 * 输入：见 VerificationStepProps
 * 输出：引导区 JSX；无副作用
 */
function VerificationStep({
  verificationTab,
  eduMailbox,
  eduMailboxMatched,
  onVerificationTabChange,
  onEduMailboxChange,
  onBackToAuthForm,
}: VerificationStepProps) {
  return (
    <div className="auth-modal-verification-view">
      <header className="auth-modal-auth-view__header auth-modal-auth-view__header--verification">
        <h3>身份认证引导</h3>
        <button type="button" className="auth-back-button" onClick={onBackToAuthForm}>
          返回登录
        </button>
      </header>
      <div className="auth-tabs auth-tabs--verification" role="tablist" aria-label="身份认证方式切换">
        <button
          type="button"
          role="tab"
          className={`auth-tab ${verificationTab === 'edu-mail' ? 'active' : ''}`}
          onClick={() => onVerificationTabChange('edu-mail')}
        >
          .edu 邮箱秒通验证
        </button>
        <button
          type="button"
          role="tab"
          className={`auth-tab ${verificationTab === 'credentials-upload' ? 'active' : ''}`}
          onClick={() => onVerificationTabChange('credentials-upload')}
        >
          上传证件
        </button>
      </div>

      {verificationTab === 'edu-mail' ? (
        <form className="auth-form auth-form--verification">
          <label>
            学校邮箱
            <div className="auth-edu-input-wrap">
              <input
                value={eduMailbox}
                onChange={(event) => onEduMailboxChange(event.target.value)}
                placeholder="例如：name@stu.pku.edu.cn"
              />
              {eduMailboxMatched ? <span className="auth-edu-input-wrap__ok">✓</span> : null}
            </div>
          </label>
          {eduMailboxMatched ? (
            <p className="auth-helper-tip auth-helper-tip--success">已自动匹配北京大学绿色通道，验证后即可秒速开通</p>
          ) : (
            <p className="auth-helper-tip">输入 .edu.cn 邮箱后可触发智能核验绿色通道</p>
          )}
          <button type="button" className="auth-submit-button">
            发送验证邮件
          </button>
        </form>
      ) : (
        <form className="auth-form auth-form--verification">
          <label>
            上传学生证/工牌
            <input type="text" placeholder="请上传认证材料（第一版先占位）" />
          </label>
          <button type="button" className="auth-submit-button">
            提交审核
          </button>
        </form>
      )}
    </div>
  )
}

export default VerificationStep
