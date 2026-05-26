import type { FormEvent } from 'react'
import { ENTITY_TOTP_SUPPORTED_APPS } from '../EntityTotpSetupForm/entityTotpSetupConstants'
import { resolveEntityAdminOrderLabel } from '../EntityTotpSetupForm/entityTotpSetupUtils'

// 01）主体 TOTP 绑定须知表单参数（EntityTotpSetupNoticeFormProps）
export interface EntityTotpSetupNoticeFormProps {
  entityName: string | null
  currentAdminOrder: number | null
  boundAdminCount: number
  minAdminCount: number
  maxAdminCount: number
  onConfirm: () => void
  onBackToCredentials: () => void
}

// 02）主体 TOTP 绑定须知表单（EntityTotpSetupNoticeForm）
/**
 * 函数名：EntityTotpSetupNoticeForm
 * 功能：展示主体管理员首次 TOTP 绑定的须知与支持应用列表，确认后进入二维码绑定弹窗。
 * 实现方法：
 * - 说明冻结账号需绑定 TOTP 方可激活
 * - 列出管理员顺位与绑定人数要求
 * - 罗列支持的验证器应用
 * 输入：见 EntityTotpSetupNoticeFormProps
 * 输出：表单 JSX；无副作用
 */
function EntityTotpSetupNoticeForm({
  entityName,
  currentAdminOrder,
  boundAdminCount,
  minAdminCount,
  maxAdminCount,
  onConfirm,
  onBackToCredentials,
}: EntityTotpSetupNoticeFormProps) {
  const adminOrderLabel = resolveEntityAdminOrderLabel(currentAdminOrder)
  const entityLabel = entityName?.trim() || '当前主体'
  const pendingAdminCount = Math.max(minAdminCount - boundAdminCount - 1, 0)

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onConfirm()
  }

  return (
    <form className="auth-form auth-entity-totp-notice" onSubmit={handleSubmit}>
      <div className="auth-auth-intro auth-auth-intro--compact">
        <h3>首次登录 · 绑定 TOTP</h3>
        <p>
          检测到您为 <strong>{entityLabel}</strong> 的{adminOrderLabel}，账号当前为冻结状态，需完成 TOTP
          绑定后方可激活（FROZEN → ACTIVE）。
        </p>
      </div>

      <div className="auth-entity-totp-notice__main">
        <section className="auth-entity-totp-setup__notice" aria-label="管理员绑定说明">
          <p className="auth-entity-totp-setup__notice-title">绑定须知</p>
          <ul className="auth-entity-totp-setup__notice-list">
            <li>
              同一主体至少需 <strong>{minAdminCount}</strong> 名、最多 <strong>{maxAdminCount}</strong>{' '}
              名管理员依次完成 TOTP 绑定
              {currentAdminOrder != null ? (
                <>
                  ；当前为第 <strong>{currentAdminOrder}</strong> 位
                </>
              ) : (
                <>；选定管理员后将确定绑定顺位</>
              )}
              。
            </li>
            <li>
              第 1 位绑定者为<strong>主管理员</strong>，第 2 位为<strong>副管理员</strong>，第 3 位为补充管理员。
            </li>
            <li>请使用本人手机上的验证器应用扫描二维码，绑定成功后输入 6 位动态验证码完成激活。</li>
            {pendingAdminCount > 0 ? (
              <li>
                您完成绑定后，仍需另有 <strong>{pendingAdminCount}</strong> 名管理员登录并完成绑定，主体管理端方可全面启用。
              </li>
            ) : null}
          </ul>
        </section>

        <section className="auth-entity-totp-setup__apps" aria-label="支持的验证器应用">
          <p className="auth-entity-totp-setup__section-label">支持绑定 TOTP 的应用（任选其一）</p>
          <ul className="auth-entity-totp-setup__app-list">
            {ENTITY_TOTP_SUPPORTED_APPS.map((app) => (
              <li key={app.name}>
                <span className="auth-entity-totp-setup__app-name">{app.name}</span>
                <span className="auth-entity-totp-setup__app-platform">{app.platforms}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="auth-entity-totp-notice__footer">
        <div className="auth-quick-actions">
          <button type="button" className="auth-inline-link-button" onClick={onBackToCredentials}>
            返回上一步
          </button>
        </div>
        <button type="submit" className="auth-submit-button">
          确定，开始绑定
        </button>
      </div>
    </form>
  )
}

export default EntityTotpSetupNoticeForm
