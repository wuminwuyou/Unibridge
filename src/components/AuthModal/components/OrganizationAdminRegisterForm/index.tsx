import { Eye, EyeOff, Lock, UserRound } from 'lucide-react'
import type { FormEvent } from 'react'

// 01）主体管理员登记表单参数（OrganizationAdminRegisterFormProps）
export interface OrganizationAdminRegisterFormProps {
  entityName: string | null
  currentAdminOrder: number | null
  boundAdminCount: number
  minAdminCount: number
  maxAdminCount: number
  displayName: string
  adminPassword: string
  isAdminPasswordVisible: boolean
  isSubmitting: boolean
  authErrorMessage: string
  successMessage: string
  onDisplayNameChange: (value: string) => void
  onAdminPasswordChange: (value: string) => void
  onToggleAdminPasswordVisibility: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBack: () => void
}

// 02）主体管理员登记表单（OrganizationAdminRegisterForm）
/**
 * 函数名：OrganizationAdminRegisterForm
 * 功能：登记新管理员展示名与登录密码，完成后进入 TOTP 绑定。
 * 输入：见 OrganizationAdminRegisterFormProps
 * 输出：表单 JSX；无副作用
 */
function OrganizationAdminRegisterForm({
  entityName,
  currentAdminOrder,
  boundAdminCount,
  minAdminCount,
  maxAdminCount,
  displayName,
  adminPassword,
  isAdminPasswordVisible,
  isSubmitting,
  authErrorMessage,
  successMessage,
  onDisplayNameChange,
  onAdminPasswordChange,
  onToggleAdminPasswordVisibility,
  onSubmit,
  onBack,
}: OrganizationAdminRegisterFormProps) {
  const entityLabel = entityName?.trim() || '当前主体'
  const orderLabel = currentAdminOrder ?? boundAdminCount + 1

  return (
    <form className="auth-form auth-organization-admin-register" onSubmit={onSubmit}>
      <div className="auth-auth-intro auth-auth-intro--compact">
        <h3>登记管理员账号</h3>
        <p>
          为 <strong>{entityLabel}</strong> 登记第 <strong>{orderLabel}</strong> 位管理员（共需至少{' '}
          <strong>{minAdminCount}</strong> 名、最多 <strong>{maxAdminCount}</strong> 名）。登记后需完成 TOTP 绑定。
        </p>
      </div>

      <div className="auth-password-row-head">
        <span>管理员展示名</span>
      </div>
      <div className={`auth-floating-field ${displayName.trim().length > 0 ? 'has-value' : ''}`}>
        <span className="auth-floating-field__icon" aria-hidden="true">
          <UserRound size={16} />
        </span>
        <input
          id="auth-organization-admin-display-name"
          value={displayName}
          onChange={(event) => onDisplayNameChange(event.target.value)}
          placeholder=" "
          disabled={isSubmitting}
        />
        <label htmlFor="auth-organization-admin-display-name">如：深大教务管理员</label>
      </div>

      <div className="auth-password-row-head">
        <span>管理员登录密码</span>
      </div>
      <div
        className={`auth-floating-field auth-floating-field--password ${adminPassword.trim().length > 0 ? 'has-value' : ''}`}
      >
        <span className="auth-floating-field__icon" aria-hidden="true">
          <Lock size={16} />
        </span>
        <input
          id="auth-organization-admin-password"
          type={isAdminPasswordVisible ? 'text' : 'password'}
          value={adminPassword}
          onChange={(event) => onAdminPasswordChange(event.target.value)}
          placeholder=" "
          autoComplete="new-password"
          disabled={isSubmitting}
        />
        <label htmlFor="auth-organization-admin-password">请设置该管理员的登录密码</label>
        <button
          type="button"
          className="auth-password-visibility-button"
          onClick={onToggleAdminPasswordVisibility}
          aria-label={isAdminPasswordVisible ? '隐藏密码' : '显示密码'}
        >
          {isAdminPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <p className="auth-helper-tip">
        当前已完成绑定 <strong>{boundAdminCount}</strong> 名管理员；达标前不会写入登录态，请继续完成下一位管理员的登记与 TOTP 绑定。
      </p>

      <div className="auth-quick-actions">
        <button type="button" className="auth-inline-link-button" onClick={onBack} disabled={isSubmitting}>
          返回上一步
        </button>
      </div>

      <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
        {isSubmitting ? '提交中...' : '登记并绑定 TOTP'}
      </button>
      {successMessage ? (
        <p className="auth-helper-tip auth-helper-tip--success" role="status">
          {successMessage}
        </p>
      ) : null}
      {authErrorMessage ? <p className="auth-helper-tip auth-helper-tip--error">{authErrorMessage}</p> : null}
    </form>
  )
}

export default OrganizationAdminRegisterForm
