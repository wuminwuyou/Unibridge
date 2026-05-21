import { createPortal } from 'react-dom'
import { useEffect, type MouseEvent } from 'react'
import CloseIconButton from './CloseIconButton'
import '../../styles/InfoPromptModal.css'

// 01）信息提示弹窗参数类型（InfoPromptModalProps）
export interface InfoPromptModalProps {
  open: boolean
  message: string
  onClose: () => void
  onConfirm?: () => void
  title?: string
  confirmText?: string
}

// 02）信息提示弹窗组件（InfoPromptModal）
/**
 * 函数名：InfoPromptModal
 * 功能：渲染通用信息提示弹窗，提供居中提示信息与确认操作。
 * 实现方法：
 * - 使用 createPortal 挂载到 document.body，避免层级冲突
 * - open=false 时不渲染
 * - open=true 时锁定 body 滚动并监听 ESC 关闭
 * - 右上角复用 CloseIconButton，右下角提供确认按钮
 * 输入：
 * - props：见 InfoPromptModalProps
 * 输出：
 * - 返回值：JSX.Element | null
 * - 副作用：锁定 body overflow、注册并清理键盘事件监听
 */
function InfoPromptModal({
  open,
  message,
  onClose,
  onConfirm,
  title = '温馨提示',
  confirmText = '确认',
}: InfoPromptModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleEscKeyDown)
    }
  }, [open, onClose])

  // 03）遮罩点击关闭处理函数（handleMaskClick）
  const handleMaskClick = (): void => {
    onClose()
  }

  // 04）弹窗容器阻止冒泡函数（handleContainerClick）
  const handleContainerClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  // 05）确认按钮点击处理函数（handleConfirmClick）
  const handleConfirmClick = (): void => {
    onConfirm?.()
    onClose()
  }

  if (!open) {
    return null
  }

  return createPortal(
    <div className="info-prompt-modal-mask" role="presentation" onClick={handleMaskClick}>
      <section
        className="info-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={handleContainerClick}
      >
        <CloseIconButton className="info-prompt-modal__close" onClick={onClose} ariaLabel="关闭提示弹窗" />

        <header className="info-prompt-modal__header">
          <h3>{title}</h3>
        </header>

        <div className="info-prompt-modal__body">
          <p>{message}</p>
        </div>

        <footer className="info-prompt-modal__footer">
          <button type="button" className="info-prompt-modal__confirm" onClick={handleConfirmClick}>
            {confirmText}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}

export default InfoPromptModal
