import { createPortal } from 'react-dom'
import { useEffect, useMemo, type MouseEvent } from 'react'
import CloseIconButton from './CloseIconButton'
import '../../styles/QrCodeModal.css'

// 01）二维码弹窗参数类型（QrCodeModalProps）
export interface QrCodeModalProps {
  open: boolean
  onClose: () => void
  value: string
  title?: string
  description?: string
  qrCodeUrl?: string
  size?: number
  showValue?: boolean
}

// 02）二维码地址构造函数（buildQrCodeImageUrl）
/**
 * 函数名：buildQrCodeImageUrl
 * 功能：将任意文本值转换为可直接展示的二维码图片地址。
 * 实现方法：
 * - 对输入内容执行 URI 编码，避免特殊字符破坏 URL
 * - 使用公共二维码服务生成 png
 * - 按传入尺寸拼接 size 参数
 * 输入：
 * - value：二维码内容原文
 * - size：二维码边长像素
 * 输出：
 * - 返回值：string，二维码图片 URL
 * - 副作用：无
 */
function buildQrCodeImageUrl(value: string, size: number): string {
  const encodedValue = encodeURIComponent(value)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}`
}

// 03）二维码弹窗组件（QrCodeModal）
/**
 * 函数名：QrCodeModal
 * 功能：渲染通用二维码弹窗，支持通过 value 自动生成二维码或使用自定义二维码图片地址。
 * 实现方法：
 * - 使用 createPortal 挂载到 document.body，避免布局层级干扰
 * - open=false 时不渲染
 * - open=true 时锁定页面滚动并监听 ESC 关闭
 * - 点击遮罩关闭，点击弹窗内容区阻止冒泡
 * 输入：
 * - props：见 QrCodeModalProps
 * 输出：
 * - 返回值：JSX.Element | null
 * - 副作用：锁定 body overflow、注册并清理键盘监听
 */
function QrCodeModal({
  open,
  onClose,
  value,
  title = '扫码查看',
  description = '请使用手机扫码继续',
  qrCodeUrl,
  size = 260,
  showValue = false,
}: QrCodeModalProps) {
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

  const resolvedQrCodeUrl = useMemo<string>(() => {
    if (qrCodeUrl && qrCodeUrl.trim().length > 0) {
      return qrCodeUrl
    }

    return buildQrCodeImageUrl(value, size)
  }, [qrCodeUrl, size, value])

  // 04）遮罩点击处理函数（handleMaskClick）
  const handleMaskClick = (): void => {
    onClose()
  }

  // 05）弹窗容器点击冒泡阻止函数（handleContainerClick）
  const handleContainerClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
  }

  if (!open) {
    return null
  }

  return createPortal(
    <div className="qr-modal-mask" role="presentation" onClick={handleMaskClick}>
      <section
        className="qr-modal"
        role="dialog"
        aria-modal="true"
        aria-label="二维码弹窗"
        onClick={handleContainerClick}
      >
        <CloseIconButton className="qr-modal__close" onClick={onClose} ariaLabel="关闭二维码弹窗" />

        <header className="qr-modal__header">
          <h3>{title}</h3>
          <p>{description}</p>
        </header>

        <div className="qr-modal__body">
          <img
            className="qr-modal__image"
            src={resolvedQrCodeUrl}
            alt="二维码"
            width={size}
            height={size}
            loading="lazy"
          />
        </div>

        {showValue ? <p className="qr-modal__value">{value}</p> : null}
      </section>
    </div>,
    document.body,
  )
}

export default QrCodeModal
