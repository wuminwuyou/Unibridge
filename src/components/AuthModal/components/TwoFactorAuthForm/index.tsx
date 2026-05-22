import { Shield } from 'lucide-react'
import type { FormEvent } from 'react'

// 01）主体 2FA 表单参数（TwoFactorAuthFormProps）
interface TwoFactorAuthFormProps {
  organizationOtpCode: string
  isSubmitting: boolean
  authErrorMessage: string
  onOtpChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBackToCredentials: () => void
}

// 02）主体 2FA 动态码表单（TwoFactorAuthForm）
/**
 * 函数名：TwoFactorAuthForm
 * 功能：渲染主体通道第二步——6 位 TOTP 验证码与返回上一步入口。
 * 实现方法：
 * - 限制数字输入
 * - 提供“返回上一步”按钮回到主体凭证输入表单
 * 输入：见 TwoFactorAuthFormProps
 * 输出：表单 JSX；无副作用
 */
function TwoFactorAuthForm({
  organizationOtpCode,
  isSubmitting,
  authErrorMessage,
  onOtpChange,
  onSubmit,
  onBackToCredentials,
}: TwoFactorAuthFormProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="auth-auth-intro auth-auth-intro--compact">
        <h3>TOTP 验证</h3>
        <p>请输入 TOTP 验证码继续登录</p>
      </div>
      <div className="auth-password-row-head">
        <span>TOTP 验证码（6位）</span>
      </div>
      <div className={`auth-floating-field ${organizationOtpCode.trim().length > 0 ? 'has-value' : ''}`}>
        <span className="auth-floating-field__icon" aria-hidden="true">
          <Shield size={16} />
        </span>
        <input
          id="auth-organization-otp"
          inputMode="numeric"
          maxLength={6}
          value={organizationOtpCode}
          onChange={(event) => onOtpChange(event.target.value.replace(/[^\d]/g, ''))}
          placeholder=" "
        />
        <label htmlFor="auth-organization-otp">请输入 TOTP 验证码</label>
      </div>
      <div className="auth-quick-actions">
        <button type="button" className="auth-inline-link-button" onClick={onBackToCredentials}>
          返回上一步
        </button>
      </div>
      <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
        {isSubmitting ? '提交中...' : '验证并登录'}
      </button>
      {authErrorMessage ? <p className="auth-helper-tip auth-helper-tip--error">{authErrorMessage}</p> : null}
    </form>
  )
}

export default TwoFactorAuthForm
