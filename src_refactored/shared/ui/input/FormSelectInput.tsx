import './FormInput.css'
import type { FormSelectInputProps } from './types'

// 01）表单下拉选择原子组件（FormSelectInput）
/**
 * 函数名：FormSelectInput
 * 功能：发布表单下拉选择原子——label + 必填标记 + 原生 select + option 列表。
 * 实现方法：
 * - 渲染 label + 必填 * 标记
 * - 内部 <select> 使用 form-input 样式类
 * - onChange 传递 option.value
 * 输入：
 * - label / value / options / onChange（必填）
 * - required / placeholder / disabled / className（可选）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function FormSelectInput({
  label,
  required = false,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  className,
}: FormSelectInputProps) {
  return (
    <label className="form-input-label">
      <span className="form-input-label-text">
        {label}
        {required && <span className="form-input-required"> *</span>}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`form-input ${className ?? ''}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
