import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { PersonalLoginMode, PersonalPanelView } from '../../types'

// 01）个人登录子表单参数（PersonalLoginFieldsProps）
interface PersonalLoginFieldsProps {
  account: string
  credential: string
  loginMode: PersonalLoginMode
  rememberMe: boolean
  isPasswordVisible: boolean
  isSubmitting: boolean
  isSendingCode: boolean
  codeCooldownSec: number
  errorMessage: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onAccountChange: (value: string) => void
  onCredentialChange: (value: string) => void
  onRememberMeChange: (checked: boolean) => void
  onTogglePasswordVisibility: () => void
  onSwitchMode: (mode: PersonalLoginMode) => void
  onSwitchToRegister: () => void
  onSendCode: () => void
}

// 02）个人登录子表单（PersonalLoginFields）
/**
 * 函数名：PersonalLoginFields
 * 功能：渲染个人通道登录表单（密码/短信双模式）。
 * 实现方法：
 * - 按 loginMode 切换密码或验证码输入区
 * - 提供记住我、模式切换与注册入口
 * 输入：见 PersonalLoginFieldsProps
 * 输出：登录表单 JSX；无副作用
 */
function PersonalLoginFields({
  account,
  credential,
  loginMode,
  rememberMe,
  isPasswordVisible,
  isSubmitting,
  isSendingCode,
  codeCooldownSec,
  errorMessage,
  onSubmit,
  onAccountChange,
  onCredentialChange,
  onRememberMeChange,
  onTogglePasswordVisibility,
  onSwitchMode,
  onSwitchToRegister,
  onSendCode,
}: PersonalLoginFieldsProps) {
  return (
    <form className="auth-form auth-personal-form-card auth-personal-form-card--login" onSubmit={onSubmit}>
      <div className="auth-auth-intro">
        <h3>欢迎登录 Unibridge</h3>
        <p>登录后可体验更多功能与服务</p>
      </div>

      <div className="auth-password-row-head">
        <span>账号</span>
      </div>

      <div className={`auth-floating-field ${account.trim().length > 0 ? 'has-value' : ''}`}>
        <span className="auth-floating-field__icon" aria-hidden="true">
          <Mail size={16} />
        </span>
        <input
          id="auth-personal-account"
          value={account}
          onChange={(event) => onAccountChange(event.target.value)}
          placeholder=" "
          autoComplete="username"
        />
        <label htmlFor="auth-personal-account">邮箱/手机号</label>
      </div>

      {loginMode === 'password' ? (
        <>
          <div className="auth-password-row-head">
            <span>密码</span>
            <button type="button" className="auth-inline-link-button">
              忘记密码?
            </button>
          </div>

          <div className={`auth-floating-field auth-floating-field--password ${credential.trim().length > 0 ? 'has-value' : ''}`}>
            <span className="auth-floating-field__icon" aria-hidden="true">
              <Lock size={16} />
            </span>
            <input
              id="auth-personal-password"
              type={isPasswordVisible ? 'text' : 'password'}
              value={credential}
              onChange={(event) => onCredentialChange(event.target.value)}
              placeholder=" "
              autoComplete="current-password"
            />
            <label htmlFor="auth-personal-password">请输入密码</label>
            <button
              type="button"
              className="auth-password-visibility-button"
              onClick={onTogglePasswordVisibility}
              aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
            >
              {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="auth-password-row-head">
            <span>短信验证码</span>
          </div>
          <div className={`auth-floating-field auth-floating-field--password ${credential.trim().length > 0 ? 'has-value' : ''}`}>
            <span className="auth-floating-field__icon" aria-hidden="true">
              <Shield size={16} />
            </span>
            <input
              id="auth-personal-sms"
              inputMode="numeric"
              maxLength={6}
              value={credential}
              onChange={(event) => onCredentialChange(event.target.value.replace(/[^\d]/g, ''))}
              placeholder=" "
            />
            <label htmlFor="auth-personal-sms">请输入验证码</label>
            <button
              type="button"
              className="auth-code-send-button"
              onClick={onSendCode}
              disabled={isSendingCode || codeCooldownSec > 0}
            >
              {isSendingCode ? '发送中...' : codeCooldownSec > 0 ? `${codeCooldownSec}s 后重试` : '获取验证码'}
            </button>
          </div>
        </>
      )}

      <div className="auth-quick-actions">
        <label className="auth-checkbox-label">
          <input type="checkbox" checked={rememberMe} onChange={(event) => onRememberMeChange(event.target.checked)} />
          记住我
        </label>
        {loginMode === 'password' ? (
          <button type="button" className="auth-inline-link-button" onClick={() => onSwitchMode('sms')}>
            短信验证码登录
          </button>
        ) : (
          <button type="button" className="auth-inline-link-button" onClick={() => onSwitchMode('password')}>
            密码登录
          </button>
        )}
      </div>

      <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
        {isSubmitting ? '提交中...' : '继续'}
      </button>

      {errorMessage ? <p className="auth-helper-tip auth-helper-tip--error">{errorMessage}</p> : null}

      <p className="auth-signup-entry">
        还没有账号？<button type="button" onClick={onSwitchToRegister}>立即注册</button>
      </p>
    </form>
  )
}

// 03）个人注册子表单参数（PersonalRegisterFieldsProps）
interface PersonalRegisterFieldsProps {
  account: string
  password: string
  confirmPassword: string
  code: string
  isSubmitting: boolean
  isSendingCode: boolean
  codeCooldownSec: number
  hintMessage: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onAccountChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onCodeChange: (value: string) => void
  onSwitchToLogin: () => void
  onSendCode: () => void
}

// 04）个人注册子表单（PersonalRegisterFields）
/**
 * 函数名：PersonalRegisterFields
 * 功能：渲染个人通道注册表单（账号、密码、确认密码、验证码）。
 * 实现方法：
 * - 本地维护密码可见状态
 * - 沿用与个人登录一致的浮动标签样式
 * 输入：见 PersonalRegisterFieldsProps
 * 输出：注册表单 JSX；无副作用（除输入焦点内的本地 state）
 */
function PersonalRegisterFields({
  account,
  password,
  confirmPassword,
  code,
  isSubmitting,
  isSendingCode,
  codeCooldownSec,
  hintMessage,
  onSubmit,
  onAccountChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onCodeChange,
  onSwitchToLogin,
  onSendCode,
}: PersonalRegisterFieldsProps) {
  const [isRegisterPasswordVisible, setIsRegisterPasswordVisible] = useState<boolean>(false)
  const [isRegisterConfirmPasswordVisible, setIsRegisterConfirmPasswordVisible] = useState<boolean>(false)

  return (
    <form
      className="auth-form auth-personal-form-card auth-personal-form-card--register auth-personal-register"
      onSubmit={onSubmit}
    >
      <div className="auth-auth-intro auth-personal-register__intro">
        <h3>欢迎来到Unibridge</h3>
        <p>注册后开启成长之旅</p>
      </div>

      <div className="auth-password-row-head auth-personal-register__row-head">
        <span>账号</span>
      </div>
      <div className={`auth-floating-field auth-personal-register__field ${account.trim().length > 0 ? 'has-value' : ''}`}>
        <span className="auth-floating-field__icon" aria-hidden="true">
          <Mail size={16} />
        </span>
        <input
          id="auth-register-account"
          value={account}
          onChange={(event) => onAccountChange(event.target.value)}
          placeholder=" "
        />
        <label htmlFor="auth-register-account">手机号</label>
      </div>

      <div className="auth-password-row-head auth-personal-register__row-head">
        <span>密码</span>
      </div>
      <div className={`auth-floating-field auth-floating-field--password auth-personal-register__field ${password.trim().length > 0 ? 'has-value' : ''}`}>
        <span className="auth-floating-field__icon" aria-hidden="true">
          <Lock size={16} />
        </span>
        <input
          id="auth-register-password"
          type={isRegisterPasswordVisible ? 'text' : 'password'}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder=" "
        />
        <label htmlFor="auth-register-password">请输入密码</label>
        <button
          type="button"
          className="auth-password-visibility-button"
          onClick={() => setIsRegisterPasswordVisible((previousValue) => !previousValue)}
          aria-label={isRegisterPasswordVisible ? '隐藏密码' : '显示密码'}
        >
          {isRegisterPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="auth-password-row-head auth-personal-register__row-head">
        <span>确认密码</span>
      </div>
      <div
        className={`auth-floating-field auth-floating-field--password auth-personal-register__field ${confirmPassword.trim().length > 0 ? 'has-value' : ''}`}
      >
        <span className="auth-floating-field__icon" aria-hidden="true">
          <Lock size={16} />
        </span>
        <input
          id="auth-register-confirm-password"
          type={isRegisterConfirmPasswordVisible ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          placeholder=" "
        />
        <label htmlFor="auth-register-confirm-password">请再次输入密码</label>
        <button
          type="button"
          className="auth-password-visibility-button"
          onClick={() => setIsRegisterConfirmPasswordVisible((previousValue) => !previousValue)}
          aria-label={isRegisterConfirmPasswordVisible ? '隐藏确认密码' : '显示确认密码'}
        >
          {isRegisterConfirmPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="auth-password-row-head auth-personal-register__row-head">
        <span>验证码</span>
      </div>
      <div className={`auth-floating-field auth-floating-field--password auth-personal-register__field ${code.trim().length > 0 ? 'has-value' : ''}`}>
        <span className="auth-floating-field__icon" aria-hidden="true">
          <Shield size={16} />
        </span>
        <input
          id="auth-register-code"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(event) => onCodeChange(event.target.value.replace(/[^\d]/g, ''))}
          placeholder=" "
        />
        <label htmlFor="auth-register-code">请输入验证码</label>
        <button
          type="button"
          className="auth-code-send-button"
          onClick={onSendCode}
          disabled={isSendingCode || codeCooldownSec > 0}
        >
          {isSendingCode ? '发送中...' : codeCooldownSec > 0 ? `${codeCooldownSec}s 后重试` : '获取验证码'}
        </button>
      </div>

      <button type="submit" className="auth-submit-button auth-personal-register__submit" disabled={isSubmitting}>
        {isSubmitting ? '提交中...' : '注册并继续'}
      </button>

      {hintMessage ? <p className="auth-helper-tip auth-personal-register__hint">{hintMessage}</p> : null}

      <p className="auth-signup-entry auth-personal-register__footer">
        已有账号？<button type="button" onClick={onSwitchToLogin}>返回登录</button>
      </p>
    </form>
  )
}

// 05）个人通道总表单参数（PersonalFormProps）
interface PersonalFormProps {
  personalPanelView: PersonalPanelView
  shouldRenderPersonalLoginForm: boolean
  shouldRenderPersonalRegisterForm: boolean
  personalLoginMode: PersonalLoginMode
  personalPhone: string
  personalCode: string
  rememberMe: boolean
  isSubmitting: boolean
  authErrorMessage: string
  isPersonalPasswordVisible: boolean
  registerAccount: string
  registerPassword: string
  registerConfirmPassword: string
  registerCode: string
  registerHintMessage: string
  isSendingPersonalLoginCode: boolean
  isSendingRegisterCode: boolean
  personalLoginCodeCooldownSec: number
  registerCodeCooldownSec: number
  onSetPersonalPhone: (value: string) => void
  onSetPersonalCode: (value: string) => void
  onSetRememberMe: (value: boolean) => void
  onSetRegisterAccount: (value: string) => void
  onSetRegisterPassword: (value: string) => void
  onSetRegisterConfirmPassword: (value: string) => void
  onSetRegisterCode: (value: string) => void
  onSubmitPersonalLogin: (event: FormEvent<HTMLFormElement>) => void
  onSubmitPersonalRegister: (event: FormEvent<HTMLFormElement>) => void
  onSwitchToSmsLogin: () => void
  onSwitchToPasswordLogin: () => void
  onSwitchToRegister: () => void
  onSwitchToLogin: () => void
  onTogglePasswordVisibility: () => void
  onSendPersonalLoginCode: () => void
  onSendRegisterCode: () => void
}

// 06）个人通道总表单（PersonalForm）
/**
 * 函数名：PersonalForm
 * 功能：组装个人登录与个人注册视图，支持登录/注册滑动切换动画所需的挂载控制。
 * 实现方法：
 * - 使用 auth-personal-form-stage 控制视图 class
 * - 条件渲染登录与注册子表单
 * 输入：见 PersonalFormProps
 * 输出：个人通道 JSX；无副作用
 */
function PersonalForm({
  personalPanelView,
  shouldRenderPersonalLoginForm,
  shouldRenderPersonalRegisterForm,
  personalLoginMode,
  personalPhone,
  personalCode,
  rememberMe,
  isSubmitting,
  authErrorMessage,
  isPersonalPasswordVisible,
  registerAccount,
  registerPassword,
  registerConfirmPassword,
  registerCode,
  registerHintMessage,
  isSendingPersonalLoginCode,
  isSendingRegisterCode,
  personalLoginCodeCooldownSec,
  registerCodeCooldownSec,
  onSetPersonalPhone,
  onSetPersonalCode,
  onSetRememberMe,
  onSetRegisterAccount,
  onSetRegisterPassword,
  onSetRegisterConfirmPassword,
  onSetRegisterCode,
  onSubmitPersonalLogin,
  onSubmitPersonalRegister,
  onSwitchToSmsLogin,
  onSwitchToPasswordLogin,
  onSwitchToRegister,
  onSwitchToLogin,
  onTogglePasswordVisibility,
  onSendPersonalLoginCode,
  onSendRegisterCode,
}: PersonalFormProps) {
  return (
    <div className={`auth-personal-form-stage ${personalPanelView === 'register' ? 'is-register-view' : ''}`}>
      {shouldRenderPersonalLoginForm ? (
        <div className="auth-personal-panel__view auth-personal-panel__view--login">
          <PersonalLoginFields
            account={personalPhone}
            credential={personalCode}
            rememberMe={rememberMe}
            loginMode={personalLoginMode}
            isSubmitting={isSubmitting}
            isSendingCode={isSendingPersonalLoginCode}
            codeCooldownSec={personalLoginCodeCooldownSec}
            errorMessage={authErrorMessage}
            isPasswordVisible={isPersonalPasswordVisible}
            onAccountChange={onSetPersonalPhone}
            onCredentialChange={onSetPersonalCode}
            onRememberMeChange={onSetRememberMe}
            onSubmit={onSubmitPersonalLogin}
            onSwitchMode={(mode) => {
              if (mode === 'sms') {
                onSwitchToSmsLogin()
              } else {
                onSwitchToPasswordLogin()
              }
            }}
            onSwitchToRegister={onSwitchToRegister}
            onTogglePasswordVisibility={onTogglePasswordVisibility}
            onSendCode={onSendPersonalLoginCode}
          />
        </div>
      ) : null}

      {shouldRenderPersonalRegisterForm ? (
        <div className="auth-personal-panel__view auth-personal-panel__view--register">
          <PersonalRegisterFields
            account={registerAccount}
            password={registerPassword}
            confirmPassword={registerConfirmPassword}
            code={registerCode}
            isSubmitting={isSubmitting}
            isSendingCode={isSendingRegisterCode}
            codeCooldownSec={registerCodeCooldownSec}
            hintMessage={registerHintMessage}
            onSubmit={onSubmitPersonalRegister}
            onAccountChange={onSetRegisterAccount}
            onPasswordChange={onSetRegisterPassword}
            onConfirmPasswordChange={onSetRegisterConfirmPassword}
            onCodeChange={onSetRegisterCode}
            onSwitchToLogin={onSwitchToLogin}
            onSendCode={onSendRegisterCode}
          />
        </div>
      ) : null}
    </div>
  )
}

export default PersonalForm
