// 01）主体 2FA 表单（TwoFactorAuthForm）
import './style.css'
import { Shield } from 'lucide-react'
import type { FormEvent } from 'react'

interface TwoFactorAuthFormProps {
  organizationOtpCode: string; isSubmitting: boolean; authErrorMessage: string
  onOtpChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onBackToCredentials: () => void
}

function TwoFactorAuthForm({ organizationOtpCode, isSubmitting, authErrorMessage, onOtpChange, onSubmit, onBackToCredentials }: TwoFactorAuthFormProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="auth-auth-intro auth-auth-intro--compact"><h3>TOTP 验证</h3><p>请输入 TOTP 验证码继续登录</p></div>
      <div className="auth-password-row-head"><span>TOTP 验证码（6位）</span></div>
      <div className={`auth-floating-field ${organizationOtpCode.trim().length > 0 ? 'has-value' : ''}`}><span className="auth-floating-field__icon"><Shield size={16} /></span><input id="auth-organization-otp" inputMode="numeric" maxLength={6} value={organizationOtpCode} onChange={e => onOtpChange(e.target.value.replace(/[^\d]/g, ''))} placeholder=" " /><label htmlFor="auth-organization-otp">请输入 TOTP 验证码</label></div>
      <div className="auth-quick-actions"><button type="button" className="auth-inline-link-button" onClick={onBackToCredentials}>返回上一步</button></div>
      <button type="submit" className="auth-submit-button" disabled={isSubmitting}>{isSubmitting ? '提交中...' : '验证并登录'}</button>
      {authErrorMessage ? <p className="auth-helper-tip auth-helper-tip--error">{authErrorMessage}</p> : null}
    </form>
  )
}

export default TwoFactorAuthForm
