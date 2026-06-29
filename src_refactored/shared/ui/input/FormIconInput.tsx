import type { FormIconInputProps } from './types'
import styles from './FormInput.module.css'

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
    <label className={styles.label}>
      <span className={styles.labelText}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </span>
      <div className={styles.iconWrap}>
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${styles.input} ${styles.hasIcon} ${className ?? ''}`.trim()}
        />
      </div>
    </label>
  )
}
