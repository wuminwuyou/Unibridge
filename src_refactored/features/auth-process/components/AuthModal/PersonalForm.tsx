// 01）个人通道表单（PersonalForm）
import './style.css'
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { PersonalLoginMode, PersonalPanelView } from '../../types/authModalTypes'

interface PersonalLoginFieldsProps {
  account: string; credential: string; loginMode: PersonalLoginMode; rememberMe: boolean
  isPasswordVisible: boolean; isSubmitting: boolean; isSendingCode: boolean; codeCooldownSec: number
  errorMessage: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onAccountChange: (value: string) => void; onCredentialChange: (value: string) => void
  onRememberMeChange: (checked: boolean) => void; onTogglePasswordVisibility: () => void
  onSwitchMode: (mode: PersonalLoginMode) => void; onSwitchToRegister: () => void; onSendCode: () => void
}

function PersonalLoginFields({ account, credential, loginMode, rememberMe, isPasswordVisible, isSubmitting, isSendingCode, codeCooldownSec, errorMessage, onSubmit, onAccountChange, onCredentialChange, onRememberMeChange, onTogglePasswordVisibility, onSwitchMode, onSwitchToRegister, onSendCode }: PersonalLoginFieldsProps) {
  return (
    <form className="auth-form auth-personal-form-card auth-personal-form-card--login" onSubmit={onSubmit}>
      <div className="auth-auth-intro"><h3>欢迎登录 Unibridge</h3><p>登录后可体验更多功能与服务</p></div>
      <div className="auth-password-row-head"><span>账号</span></div>
      <div className={`auth-floating-field ${account.trim().length > 0 ? 'has-value' : ''}`}>
        <span className="auth-floating-field__icon" aria-hidden="true"><Mail size={16} /></span>
        <input id="auth-personal-account" value={account} onChange={e => onAccountChange(e.target.value)} placeholder=" " autoComplete="username" />
        <label htmlFor="auth-personal-account">邮箱/手机号</label>
      </div>
      {loginMode === 'password' ? (
        <>
          <div className="auth-password-row-head"><span>密码</span><button type="button" className="auth-inline-link-button">忘记密码?</button></div>
          <div className={`auth-floating-field auth-floating-field--password ${credential.trim().length > 0 ? 'has-value' : ''}`}>
            <span className="auth-floating-field__icon" aria-hidden="true"><Lock size={16} /></span>
            <input id="auth-personal-password" type={isPasswordVisible ? 'text' : 'password'} value={credential} onChange={e => onCredentialChange(e.target.value)} placeholder=" " autoComplete="current-password" />
            <label htmlFor="auth-personal-password">请输入密码</label>
            <button type="button" className="auth-password-visibility-button" onClick={onTogglePasswordVisibility} aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}>{isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </>
      ) : (
        <>
          <div className="auth-password-row-head"><span>短信验证码</span></div>
          <div className={`auth-floating-field auth-floating-field--password ${credential.trim().length > 0 ? 'has-value' : ''}`}>
            <span className="auth-floating-field__icon" aria-hidden="true"><Shield size={16} /></span>
            <input id="auth-personal-sms" inputMode="numeric" maxLength={6} value={credential} onChange={e => onCredentialChange(e.target.value.replace(/[^\d]/g, ''))} placeholder=" " />
            <label htmlFor="auth-personal-sms">请输入验证码</label>
            <button type="button" className="auth-code-send-button" onClick={onSendCode} disabled={isSendingCode || codeCooldownSec > 0}>{isSendingCode ? '发送中...' : codeCooldownSec > 0 ? `${codeCooldownSec}s 后重试` : '获取验证码'}</button>
          </div>
        </>
      )}
      <div className="auth-quick-actions">
        <label className="auth-checkbox-label"><input type="checkbox" checked={rememberMe} onChange={e => onRememberMeChange(e.target.checked)} />记住我</label>
        {loginMode === 'password' ? <button type="button" className="auth-inline-link-button" onClick={() => onSwitchMode('sms')}>短信验证码登录</button> : <button type="button" className="auth-inline-link-button" onClick={() => onSwitchMode('password')}>密码登录</button>}
      </div>
      <button type="submit" className="auth-submit-button" disabled={isSubmitting}>{isSubmitting ? '提交中...' : '继续'}</button>
      {errorMessage ? <p className="auth-helper-tip auth-helper-tip--error">{errorMessage}</p> : null}
      <p className="auth-signup-entry">还没有账号？<button type="button" onClick={onSwitchToRegister}>立即注册</button></p>
    </form>
  )
}

interface PersonalRegisterFieldsProps {
  account: string; password: string; confirmPassword: string; code: string; isSubmitting: boolean
  isSendingCode: boolean; codeCooldownSec: number; hintMessage: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; onAccountChange: (value: string) => void
  onPasswordChange: (value: string) => void; onConfirmPasswordChange: (value: string) => void
  onCodeChange: (value: string) => void; onSwitchToLogin: () => void; onSendCode: () => void
}

function PersonalRegisterFields({ account, password, confirmPassword, code, isSubmitting, isSendingCode, codeCooldownSec, hintMessage, onSubmit, onAccountChange, onPasswordChange, onConfirmPasswordChange, onCodeChange, onSwitchToLogin, onSendCode }: PersonalRegisterFieldsProps) {
  const [isRegisterPasswordVisible, setIsRegisterPasswordVisible] = useState(false)
  const [isRegisterConfirmPasswordVisible, setIsRegisterConfirmPasswordVisible] = useState(false)
  return (
    <form className="auth-form auth-personal-form-card auth-personal-form-card--register auth-personal-register" onSubmit={onSubmit}>
      <div className="auth-auth-intro auth-personal-register__intro"><h3>欢迎来到Unibridge</h3><p>注册后开启成长之旅</p></div>
      <div className="auth-password-row-head auth-personal-register__row-head"><span>账号</span></div>
      <div className={`auth-floating-field auth-personal-register__field ${account.trim().length > 0 ? 'has-value' : ''}`}><span className="auth-floating-field__icon" aria-hidden="true"><Mail size={16} /></span><input id="auth-register-account" value={account} onChange={e => onAccountChange(e.target.value)} placeholder=" " /><label htmlFor="auth-register-account">手机号</label></div>
      <div className="auth-password-row-head auth-personal-register__row-head"><span>密码</span></div>
      <div className={`auth-floating-field auth-floating-field--password auth-personal-register__field ${password.trim().length > 0 ? 'has-value' : ''}`}><span className="auth-floating-field__icon" aria-hidden="true"><Lock size={16} /></span><input id="auth-register-password" type={isRegisterPasswordVisible ? 'text' : 'password'} value={password} onChange={e => onPasswordChange(e.target.value)} placeholder=" " /><label htmlFor="auth-register-password">请输入密码</label><button type="button" className="auth-password-visibility-button" onClick={() => setIsRegisterPasswordVisible(v => !v)} aria-label={isRegisterPasswordVisible ? '隐藏密码' : '显示密码'}>{isRegisterPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
      <div className="auth-password-row-head auth-personal-register__row-head"><span>确认密码</span></div>
      <div className={`auth-floating-field auth-floating-field--password auth-personal-register__field ${confirmPassword.trim().length > 0 ? 'has-value' : ''}`}><span className="auth-floating-field__icon" aria-hidden="true"><Lock size={16} /></span><input id="auth-register-confirm-password" type={isRegisterConfirmPasswordVisible ? 'text' : 'password'} value={confirmPassword} onChange={e => onConfirmPasswordChange(e.target.value)} placeholder=" " /><label htmlFor="auth-register-confirm-password">请再次输入密码</label><button type="button" className="auth-password-visibility-button" onClick={() => setIsRegisterConfirmPasswordVisible(v => !v)} aria-label={isRegisterConfirmPasswordVisible ? '隐藏确认密码' : '显示确认密码'}>{isRegisterConfirmPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
      <div className="auth-password-row-head auth-personal-register__row-head"><span>验证码</span></div>
      <div className={`auth-floating-field auth-floating-field--password auth-personal-register__field ${code.trim().length > 0 ? 'has-value' : ''}`}><span className="auth-floating-field__icon" aria-hidden="true"><Shield size={16} /></span><input id="auth-register-code" inputMode="numeric" maxLength={6} value={code} onChange={e => onCodeChange(e.target.value.replace(/[^\d]/g, ''))} placeholder=" " /><label htmlFor="auth-register-code">请输入验证码</label><button type="button" className="auth-code-send-button" onClick={onSendCode} disabled={isSendingCode || codeCooldownSec > 0}>{isSendingCode ? '发送中...' : codeCooldownSec > 0 ? `${codeCooldownSec}s 后重试` : '获取验证码'}</button></div>
      <button type="submit" className="auth-submit-button auth-personal-register__submit" disabled={isSubmitting}>{isSubmitting ? '提交中...' : '注册并继续'}</button>
      {hintMessage ? <p className="auth-helper-tip auth-personal-register__hint">{hintMessage}</p> : null}
      <p className="auth-signup-entry auth-personal-register__footer">已有账号？<button type="button" onClick={onSwitchToLogin}>返回登录</button></p>
    </form>
  )
}

interface PersonalFormProps {
  personalPanelView: PersonalPanelView; shouldRenderPersonalLoginForm: boolean; shouldRenderPersonalRegisterForm: boolean
  personalLoginMode: PersonalLoginMode; personalPhone: string; personalCode: string; rememberMe: boolean
  isSubmitting: boolean; authErrorMessage: string; isPersonalPasswordVisible: boolean
  registerAccount: string; registerPassword: string; registerConfirmPassword: string; registerCode: string; registerHintMessage: string
  isSendingPersonalLoginCode: boolean; isSendingRegisterCode: boolean; personalLoginCodeCooldownSec: number; registerCodeCooldownSec: number
  onSetPersonalPhone: (v: string) => void; onSetPersonalCode: (v: string) => void; onSetRememberMe: (v: boolean) => void
  onSetRegisterAccount: (v: string) => void; onSetRegisterPassword: (v: string) => void; onSetRegisterConfirmPassword: (v: string) => void
  onSetRegisterCode: (v: string) => void; onSubmitPersonalLogin: (e: FormEvent<HTMLFormElement>) => void
  onSubmitPersonalRegister: (e: FormEvent<HTMLFormElement>) => void; onSwitchToSmsLogin: () => void; onSwitchToPasswordLogin: () => void
  onSwitchToRegister: () => void; onSwitchToLogin: () => void; onTogglePasswordVisibility: () => void
  onSendPersonalLoginCode: () => void; onSendRegisterCode: () => void
}

function PersonalForm(p: PersonalFormProps) {
  return (
    <div className={`auth-personal-form-stage ${p.personalPanelView === 'register' ? 'is-register-view' : ''}`}>
      {p.shouldRenderPersonalLoginForm ? (
        <div className="auth-personal-panel__view auth-personal-panel__view--login">
          <PersonalLoginFields
            account={p.personalPhone} credential={p.personalCode} rememberMe={p.rememberMe}
            loginMode={p.personalLoginMode} isSubmitting={p.isSubmitting} isSendingCode={p.isSendingPersonalLoginCode}
            codeCooldownSec={p.personalLoginCodeCooldownSec} errorMessage={p.authErrorMessage} isPasswordVisible={p.isPersonalPasswordVisible}
            onAccountChange={p.onSetPersonalPhone} onCredentialChange={p.onSetPersonalCode} onRememberMeChange={p.onSetRememberMe}
            onSubmit={p.onSubmitPersonalLogin} onSwitchMode={m => { if (m === 'sms') p.onSwitchToSmsLogin(); else p.onSwitchToPasswordLogin() }}
            onSwitchToRegister={p.onSwitchToRegister} onTogglePasswordVisibility={p.onTogglePasswordVisibility} onSendCode={p.onSendPersonalLoginCode}
          />
        </div>
      ) : null}
      {p.shouldRenderPersonalRegisterForm ? (
        <div className="auth-personal-panel__view auth-personal-panel__view--register">
          <PersonalRegisterFields
            account={p.registerAccount} password={p.registerPassword} confirmPassword={p.registerConfirmPassword} code={p.registerCode}
            isSubmitting={p.isSubmitting} isSendingCode={p.isSendingRegisterCode} codeCooldownSec={p.registerCodeCooldownSec} hintMessage={p.registerHintMessage}
            onSubmit={p.onSubmitPersonalRegister} onAccountChange={p.onSetRegisterAccount} onPasswordChange={p.onSetRegisterPassword}
            onConfirmPasswordChange={p.onSetRegisterConfirmPassword} onCodeChange={p.onSetRegisterCode}
            onSwitchToLogin={p.onSwitchToLogin} onSendCode={p.onSendRegisterCode}
          />
        </div>
      ) : null}
    </div>
  )
}

export default PersonalForm
