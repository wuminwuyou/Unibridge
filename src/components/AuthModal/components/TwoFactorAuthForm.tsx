import { Shield } from 'lucide-react'
import type { FormEvent } from 'react'

// 01）主体 2FA 表单参数（TwoFactorAuthFormProps）
interface TwoFactorAuthFormProps {
  organizationOtpCode: string
  organizationPasswordDigest: string
  authErrorMessage: string
  onOtpChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

// 02）主体 2FA 动态码表单（TwoFactorAuthForm）
/**
 * 函数名：TwoFactorAuthForm
 * 功能：渲染主体通道第二步——6 位动态验证码与摘要提示。
 * 实现方法：
 * - 限制数字输入
 * - 展示密码摘要前缀供调试/演示
 * 输入：见 TwoFactorAuthFormProps
 * 输出：表单 JSX；无副作用
 */
function TwoFactorAuthForm({
  organizationOtpCode,
  organizationPasswordDigest,
  authErrorMessage,
  onOtpChange,
  onSubmit,
}: TwoFactorAuthFormProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="auth-auth-intro auth-auth-intro--compact">
        <h3>二次验证</h3>
        <p>请输入动态验证码继续登录</p>
      </div>
      <div className="auth-password-row-head">
        <span>动态验证码（6位）</span>
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
        <label htmlFor="auth-organization-otp">请输入动态码</label>
      </div>
      <p className="auth-helper-tip auth-helper-tip--success">
        已完成 SHA256 加密提交：{organizationPasswordDigest.slice(0, 12)}...
      </p>
      <button type="submit" className="auth-submit-button">
        验证并登录
      </button>
      {authErrorMessage ? <p className="auth-helper-tip auth-helper-tip--error">{authErrorMessage}</p> : null}
    </form>
  )
}

export default TwoFactorAuthForm
