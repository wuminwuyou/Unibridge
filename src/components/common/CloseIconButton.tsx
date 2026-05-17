import { useState, type AnimationEvent, type MouseEventHandler } from 'react'

// 01）关闭按钮组件参数类型（CloseIconButtonProps）
interface CloseIconButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>
  className?: string
  ariaLabel?: string
}

// 02）关闭按钮组件（CloseIconButton）
/**
 * 函数名：CloseIconButton
 * 功能：渲染通用关闭按钮，提供“X”图标与无障碍语义，可在弹窗等场景复用。
 * 实现方法：
 * - 对外暴露 onClick 回调处理关闭动作
 * - 支持可选 className 便于业务场景追加样式定位
 * - 默认注入 ariaLabel，保证屏幕阅读器可识别关闭用途
 * 输入：
 * - onClick：按钮点击事件处理函数
 * - className：追加样式类名，可选
 * - ariaLabel：无障碍标签文本，可选
 * 输出：
 * - 返回值：JSX.Element，关闭按钮节点
 * - 副作用：无
 */
function CloseIconButton({ onClick, className = '', ariaLabel = '关闭' }: CloseIconButtonProps) {
  const [isHoverAnimating, setIsHoverAnimating] = useState<boolean>(false)
  const [isPointerInside, setIsPointerInside] = useState<boolean>(false)

  const normalizedClassName = `close-icon-button ${className} ${isHoverAnimating ? 'close-icon-button--animating' : ''} ${
    isPointerInside && !isHoverAnimating ? 'close-icon-button--hovered' : ''
  }`.trim()

  return (
    <button
      type="button"
      className={normalizedClassName}
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => {
        setIsPointerInside(true)
        if (!isHoverAnimating) {
          setIsHoverAnimating(true)
        }
      }}
      onMouseLeave={() => {
        setIsPointerInside(false)
        setIsHoverAnimating(false)
      }}
      onAnimationEnd={(event: AnimationEvent<HTMLButtonElement>) => {
        if (event.animationName === 'closeIconHoverBounceSpin') {
          setIsHoverAnimating(false)
        }
      }}
    >
      <span className="close-icon-button__glyph" aria-hidden="true">
        ×
      </span>
    </button>
  )
}

export default CloseIconButton
