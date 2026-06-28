import type { CSSProperties } from 'react'
import './LoadingSpinner.css'

// 01）加载中组件参数类型（LoadingSpinnerProps）
export interface LoadingSpinnerProps {
  size?: number
  label?: string
  className?: string
}

// 02）加载中组件段数常量（SPINNER_SEGMENT_COUNT）
const SPINNER_SEGMENT_COUNT = 12

// 03）iOS 风格加载中组件（LoadingSpinner）
/**
 * 函数名：LoadingSpinner
 * 功能：渲染可复用"加载中"指示器，提供类似 iOS 的圆环分段旋转效果。
 * 实现方法：
 * - 使用 12 段短线围成圆环，每段按角度均匀分布
 * - 通过统一旋转动画与分段透明度错峰形成流动感
 * - 支持 size 控制整体尺寸，label 控制无障碍说明
 * 输入：
 * - size：加载器直径（像素），默认 28
 * - label：可读提示文案，用于无障碍与下方文本，默认"加载中…"
 * - className：外部扩展类名，可选
 * 输出：
 * - 返回值：JSX.Element，包含旋转圆环与文本提示
 * - 副作用：无
 */
function LoadingSpinner({ size = 28, label = '加载中…', className = '' }: LoadingSpinnerProps) {
  const spinnerClassName = `loading-spinner ${className}`.trim()
  const segments = Array.from({ length: SPINNER_SEGMENT_COUNT }, (_, index) => index)

  return (
    <div className={spinnerClassName} role="status" aria-label={label} aria-live="polite">
      <span className="loading-spinner__ring" style={{ width: `${size}px`, height: `${size}px` }} aria-hidden="true">
        {segments.map((segmentIndex) => (
          <span
            key={segmentIndex}
            className="loading-spinner__segment"
            style={
              {
                '--segment-index': segmentIndex,
                '--segment-count': SPINNER_SEGMENT_COUNT,
              } as CSSProperties
            }
          />
        ))}
      </span>
      <span className="loading-spinner__label">{label}</span>
    </div>
  )
}

export default LoadingSpinner
