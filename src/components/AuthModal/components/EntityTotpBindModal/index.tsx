import { createPortal } from 'react-dom'
import { RefreshCw, Shield } from 'lucide-react'
import { useEffect, type FormEvent, type MouseEvent } from 'react'
import CloseIconButton from '../../../common/CloseIconButton'
import { formatEntityTotpQrCountdown } from '../EntityTotpSetupForm/entityTotpSetupUtils'
import './EntityTotpBindModal.css'

// 01）主体 TOTP 二维码绑定弹窗参数（EntityTotpBindModalProps）
export interface EntityTotpBindModalProps {
  open: boolean
  entityName: string | null
  qrCodeDataUrl: string | null
  qrCodeCountdownSec: number
  qrCodeExpireTotalSec: number
  isQrExpired: boolean
  isQrLoading: boolean
  totpSetupOtpCode: string
  isSubmitting: boolean
  authErrorMessage: string
  successMessage: string
  onTotpSetupOtpChange: (value: string) => void
  onRefreshQrCode: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}

// 02）主体 TOTP 二维码绑定弹窗（EntityTotpBindModal）
/**
 * 函数名：EntityTotpBindModal
 * 功能：在独立弹窗中展示 TOTP 绑定二维码、倒计时与 6 位验证码确认。
 * 实现方法：
 * - createPortal 挂载至 document.body，层级高于登录弹窗
 * - 展示 QR 码与刷新入口，底部提交绑定
 * - ESC / 遮罩 / 关闭按钮仅关闭本弹窗，不关闭登录弹窗
 * 输入：见 EntityTotpBindModalProps
 * 输出：Portal JSX 或 null；打开时锁定 body 滚动
 */
function EntityTotpBindModal({
  open,
  entityName,
  qrCodeDataUrl,
  qrCodeCountdownSec,
  qrCodeExpireTotalSec,
  isQrExpired,
  isQrLoading,
  totpSetupOtpCode,
  isSubmitting,
  authErrorMessage,
  successMessage,
  onTotpSetupOtpChange,
  onRefreshQrCode,
  onSubmit,
  onClose,
}: EntityTotpBindModalProps) {
  const entityLabel = entityName?.trim() || '当前主体'

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleEscKeyDown)
    }
  }, [open, isSubmitting, onClose])

  const handleMaskClick = (): void => {
    if (isSubmitting) {
      return
    }
    onClose()
  }

  const handleContainerClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  if (!open) {
    return null
  }

  return createPortal(
    <div className="entity-totp-bind-modal-mask" role="presentation" onClick={handleMaskClick}>
      <section
        className="entity-totp-bind-modal"
        role="dialog"
        aria-modal="true"
        aria-label="TOTP 二维码绑定"
        onClick={handleContainerClick}
      >
        <CloseIconButton
          className="entity-totp-bind-modal__close"
          onClick={() => {
            if (!isSubmitting) {
              onClose()
            }
          }}
          ariaLabel="关闭二维码绑定弹窗"
        />

        <header className="entity-totp-bind-modal__header">
          <h3>扫描二维码绑定 TOTP</h3>
          <p>请使用验证器应用扫描下方二维码，完成后输入 6 位动态码确认绑定。</p>
        </header>

        <form className="entity-totp-bind-modal__form" onSubmit={onSubmit}>
          <div className="entity-totp-bind-modal__qr-head">
            <span className="entity-totp-bind-modal__entity-label">{entityLabel}</span>
            {!isQrExpired && qrCodeCountdownSec > 0 ? (
              <span className="entity-totp-bind-modal__qr-timer" role="timer" aria-live="polite">
                剩余 {formatEntityTotpQrCountdown(qrCodeCountdownSec)}
              </span>
            ) : null}
          </div>

          <div className="entity-totp-bind-modal__qr-box">
            {isQrLoading ? (
              <p className="entity-totp-bind-modal__qr-placeholder">正在生成二维码…</p>
            ) : qrCodeDataUrl && !isQrExpired ? (
              <img
                className="entity-totp-bind-modal__qr-image"
                src={qrCodeDataUrl}
                alt={`${entityLabel} TOTP 绑定二维码`}
              />
            ) : (
              <p className="entity-totp-bind-modal__qr-placeholder">
                {isQrExpired ? '二维码已过期，请刷新后重新扫描' : '暂无可展示的二维码'}
              </p>
            )}
          </div>

          <p className="entity-totp-bind-modal__qr-hint">
            单次二维码有效 <strong>{formatEntityTotpQrCountdown(qrCodeExpireTotalSec)}</strong>
            ，超时请点击刷新并使用验证器中的最新动态码。
          </p>

          <button
            type="button"
            className="entity-totp-bind-modal__refresh"
            onClick={onRefreshQrCode}
            disabled={isQrLoading || isSubmitting}
          >
            <RefreshCw size={14} aria-hidden="true" />
            刷新二维码
          </button>

          <div className={`auth-floating-field ${totpSetupOtpCode.trim().length > 0 ? 'has-value' : ''}`}>
            <span className="auth-floating-field__icon" aria-hidden="true">
              <Shield size={16} />
            </span>
            <input
              id="entity-totp-bind-modal-otp"
              inputMode="numeric"
              maxLength={6}
              value={totpSetupOtpCode}
              onChange={(event) => onTotpSetupOtpChange(event.target.value.replace(/[^\d]/g, ''))}
              placeholder=" "
              disabled={isSubmitting}
            />
            <label htmlFor="entity-totp-bind-modal-otp">请输入验证器中的 6 位动态码</label>
          </div>

          <button
            type="submit"
            className="auth-submit-button entity-totp-bind-modal__submit"
            disabled={isSubmitting || isQrLoading || !qrCodeDataUrl || isQrExpired}
          >
            {isSubmitting ? '提交中...' : '确认绑定并激活'}
          </button>

          {successMessage ? (
            <p className="auth-helper-tip auth-helper-tip--success" role="status">
              {successMessage}
            </p>
          ) : null}
          {authErrorMessage ? <p className="auth-helper-tip auth-helper-tip--error">{authErrorMessage}</p> : null}
        </form>
      </section>
    </div>,
    document.body,
  )
}

export default EntityTotpBindModal
