import { FormInput } from './FormInput'
import type { FormIconInputProps } from './types'

// 01）带图标表单文本输入原子组件（FormIconInput）
/**
 * 函数名：FormIconInput
 * 功能：发布表单带前置图标的文本输入原子——在 FormInput 基础上叠加图标装饰。
 * 实现方法：
 * - 使用 input-icon-wrap 定位图标
 * - 内部委托 FormInput 渲染，附加 has-icon class
 * 输入：
 * - icon / label / value / onChange（必填）
 * - required / placeholder / type / disabled / className（可选）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function FormIconInput({
  icon,
  label,
  required = false,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  className,
}: FormIconInputProps) {
  return (
    <label className="form-input-label">
      <span className="form-input-label-text">
        {label}
        {required && <span className="form-input-required"> *</span>}
      </span>
      <div className="form-input-icon-wrap">
        <span className="form-input-icon-wrap__icon" aria-hidden="true">
          {icon}
        </span>
        <FormInput
          label=""
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          disabled={disabled}
          className={`form-input--has-icon ${className ?? ''}`}
        />
      </div>
    </label>
  )
}
