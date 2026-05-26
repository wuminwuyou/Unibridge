import { UserRound } from 'lucide-react'
import type { FormEvent } from 'react'
import type { OrganizationAdminOption } from '../../../../api/Auth'

// 01）主体管理员选择表单参数（OrganizationAdminSelectFormProps）
export interface OrganizationAdminSelectFormProps {
  entityName: string | null
  admins: OrganizationAdminOption[]
  selectedAdminUid: string
  isSubmitting: boolean
  authErrorMessage: string
  onSelectedAdminChange: (adminUid: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBackToCredentials: () => void
}

// 02）主体管理员选择表单（OrganizationAdminSelectForm）
/**
 * 函数名：OrganizationAdminSelectForm
 * 功能：在主体根密码校验通过后，展示可选管理员列表并提交 select-admin。
 * 实现方法：
 * - 单选列表展示 displayName 与主/副管理员标识
 * - 提交后由上层调用 selectOrganizationAdmin
 * 输入：见 OrganizationAdminSelectFormProps
 * 输出：表单 JSX；无副作用
 */
function OrganizationAdminSelectForm({
  entityName,
  admins,
  selectedAdminUid,
  isSubmitting,
  authErrorMessage,
  onSelectedAdminChange,
  onSubmit,
  onBackToCredentials,
}: OrganizationAdminSelectFormProps) {
  const entityLabel = entityName?.trim() || '当前主体'

  return (
    <form className="auth-form auth-organization-admin-select" onSubmit={onSubmit}>
      <div className="auth-auth-intro auth-auth-intro--compact">
        <h3>选择管理员身份</h3>
        <p>
          您以 <strong>{entityLabel}</strong> 主体根密码登录，请选择本次要操作的管理员账号。
        </p>
      </div>

      <fieldset className="auth-organization-admin-select__list" aria-label="管理员列表">
        <legend className="auth-organization-admin-select__legend">可选管理员</legend>
        {admins.map((admin) => {
          const inputId = `auth-organization-admin-${admin.adminUid}`
          const isSelected = selectedAdminUid === admin.adminUid

          return (
            <label
              key={admin.adminUid}
              htmlFor={inputId}
              className={`auth-organization-admin-select__item ${isSelected ? 'is-selected' : ''}`}
            >
              <input
                id={inputId}
                type="radio"
                name="organization-admin"
                value={admin.adminUid}
                checked={isSelected}
                onChange={() => onSelectedAdminChange(admin.adminUid)}
              />
              <span className="auth-organization-admin-select__icon" aria-hidden="true">
                <UserRound size={18} />
              </span>
              <span className="auth-organization-admin-select__meta">
                <span className="auth-organization-admin-select__name">{admin.displayName}</span>
                <span className="auth-organization-admin-select__uid">{admin.adminUid}</span>
              </span>
              {admin.isPrimary ? (
                <span className="auth-organization-admin-select__badge">主管理员</span>
              ) : (
                <span className="auth-organization-admin-select__badge auth-organization-admin-select__badge--secondary">
                  管理员
                </span>
              )}
            </label>
          )
        })}
      </fieldset>

      <div className="auth-quick-actions">
        <button type="button" className="auth-inline-link-button" onClick={onBackToCredentials} disabled={isSubmitting}>
          返回上一步
        </button>
      </div>

      <button type="submit" className="auth-submit-button" disabled={isSubmitting || !selectedAdminUid}>
        {isSubmitting ? '提交中...' : '确认并继续'}
      </button>
      {authErrorMessage ? <p className="auth-helper-tip auth-helper-tip--error">{authErrorMessage}</p> : null}
    </form>
  )
}

export default OrganizationAdminSelectForm
