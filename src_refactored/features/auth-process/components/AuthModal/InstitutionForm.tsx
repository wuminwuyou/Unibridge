// 01）机构主体凭证登录表单（InstitutionForm）
import './style.css'
import { Building2, Eye, EyeOff, Lock } from 'lucide-react'
import type { FormEvent } from 'react'

interface InstitutionFormProps {
  organizationCode: string; organizationPassword: string; isOrganizationPasswordVisible: boolean
  isSubmitting: boolean; authErrorMessage: string
  onOrganizationCodeChange: (value: string) => void; onOrganizationPasswordChange: (value: string) => void
  onToggleOrganizationPasswordVisibility: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function InstitutionForm({ organizationCode, organizationPassword, isOrganizationPasswordVisible, isSubmitting, authErrorMessage, onOrganizationCodeChange, onOrganizationPasswordChange, onToggleOrganizationPasswordVisibility, onSubmit }: InstitutionFormProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="auth-auth-intro auth-auth-intro--compact"><h3>欢迎登录 Unibridge</h3><p>登录后可体验更多功能与服务</p></div>
      <div className="auth-password-row-head"><span>机构代码</span></div>
      <div className={`auth-floating-field ${organizationCode.trim().length > 0 ? 'has-value' : ''}`}><span className="auth-floating-field__icon"><Building2 size={16} /></span><input id="auth-organization-code" value={organizationCode} onChange={e => onOrganizationCodeChange(e.target.value)} placeholder=" " /><label htmlFor="auth-organization-code">请输入机构代码</label></div>
      <div className="auth-password-row-head"><span>登录凭证</span></div>
      <div className={`auth-floating-field auth-floating-field--password ${organizationPassword.trim().length > 0 ? 'has-value' : ''}`}><span className="auth-floating-field__icon"><Lock size={16} /></span><input id="auth-organization-password" type={isOrganizationPasswordVisible ? 'text' : 'password'} value={organizationPassword} onChange={e => onOrganizationPasswordChange(e.target.value)} placeholder=" " autoComplete="current-password" /><label htmlFor="auth-organization-password">请输入登录凭证</label><button type="button" className="auth-password-visibility-button" onClick={onToggleOrganizationPasswordVisibility} aria-label={isOrganizationPasswordVisible ? '隐藏密码' : '显示密码'}>{isOrganizationPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
      <p className="auth-helper-tip">* 主体账号由平台官方分发，若遗失凭证请联系系统运营人员</p>
      <button type="submit" className="auth-submit-button" disabled={isSubmitting}>{isSubmitting ? '提交中...' : '下一步'}</button>
      {authErrorMessage ? <p className="auth-helper-tip auth-helper-tip--error">{authErrorMessage}</p> : null}
    </form>
  )
}

export default InstitutionForm
