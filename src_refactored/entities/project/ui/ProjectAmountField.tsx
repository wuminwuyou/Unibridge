// 01）项目预算字段（ProjectAmountField）
/**
 * 函数名：ProjectAmountField
 * 功能：发布项目表单的「预算 / 金额」字段。
 * 实现方法：
 * - 委托 shared/ui/input 的 FormInput 渲染
 * 输入：
 * - value / onChange
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { FormInput } from '@shared/ui/input'

export interface ProjectAmountFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ProjectAmountField({ value, onChange, disabled }: ProjectAmountFieldProps) {
  return (
    <FormInput
      label="预算 / 金额"
      required
      value={value}
      onChange={onChange}
      placeholder="例如：¥3000 - ¥5000"
      disabled={disabled}
    />
  )
}
