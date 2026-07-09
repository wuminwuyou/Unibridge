import type { FormInputProps } from './types'
import styles from './FormInput.module.css'

// 01）表单文本输入原子组件（FormInput）
/**
 * 函数名：FormInput
 * 功能：发布表单通用文本输入原子——label + 必填标记 + input + placeholder 插槽，无业务语义。
 * 实现方法：
 * - 渲染 label + 必填 * 标记
 * - 内部 <input> 使用统一的 form-input 样式类
 * - onChange 默认传递 event.target.value，可通过 onChangeEvent 覆写
 * 输入：
 * - label / value / onChange（必填）
 * - required / placeholder / type / disabled / className / onChangeEvent（可选）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function FormInput({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  className,
  onChangeEvent,
  onBlur,
}: FormInputProps) {
  return (
    <label className={styles.label}>
      <span className={styles.labelText}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChangeEvent ?? ((event) => onChange(event.target.value))}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`${styles.input} ${className ?? ''}`.trim()}
      />
    </label>
  )
}
