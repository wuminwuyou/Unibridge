import './FormInput.css'
import type { FormDateInputProps } from './types'

// 01）表单日期输入原子组件（FormDateInput）
/**
 * 函数名：FormDateInput
 * 功能：发布表单日期输入原子——label + 必填标记 + type="date" input。
 * 实现方法：
 * - 渲染 label + 必填 * 标记
 * - 内部 <input type="date"> 使用 form-input 样式类
 * 输入：
 * - label / value / onChange（必填）
 * - required / placeholder / disabled / className（可选）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function FormDateInput({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
}: FormDateInputProps) {
  return (
    <label className="form-input-label">
      <span className="form-input-label-text">
        {label}
        {required && <span className="form-input-required"> *</span>}
      </span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-input ${className ?? ''}`}
      />
    </label>
  )
}
