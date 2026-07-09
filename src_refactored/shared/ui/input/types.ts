import type { ChangeEvent } from 'react'

// 01）输入框基础 Props（FormInputBaseProps）
export interface FormInputBaseProps {
  /** 字段标签文本 */
  label: string
  /** 是否必填（显示红色 * 标记） */
  required?: boolean
  /** 当前值 */
  value: string
  /** 值变更回调 */
  onChange: (value: string) => void
}

// 02）输入框完整 Props（FormInputProps）
export interface FormInputProps extends FormInputBaseProps {
  /** 占位提示文本 */
  placeholder?: string
  /** HTML input type */
  type?: 'text' | 'email' | 'url' | 'number'
  /** 是否禁用 */
  disabled?: boolean
  /** 附加 className */
  className?: string
  /** 自定义 onChange 事件包装（默认 event.target.value） */
  onChangeEvent?: (event: ChangeEvent<HTMLInputElement>) => void
  /** 失焦回调（用于输入完成后的校验等） */
  onBlur?: () => void
}

// 03）带图标输入框 Props（FormIconInputProps）
export interface FormIconInputProps extends FormInputProps {
  /** 前置图标（lucide-react 组件） */
  icon: React.ReactNode
}

// 04）下拉选择 Props（FormSelectInputProps）
export interface FormSelectInputProps extends FormInputBaseProps {
  /** 选项列表 */
  options: { value: string; label: string }[]
  /** 占位文本（空选项） */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 附加 className */
  className?: string
}

// 05）日期输入 Props（FormDateInputProps）
export interface FormDateInputProps extends FormInputBaseProps {
  /** 占位文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 附加 className */
  className?: string
  /** 可选的最小日期（YYYY-MM-DD），早于此日期的选项将被禁用 */
  min?: string
}
