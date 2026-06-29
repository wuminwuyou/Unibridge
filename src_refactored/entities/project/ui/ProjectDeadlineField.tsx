// 01）项目截止日期字段（ProjectDeadlineField）
/**
 * 函数名：ProjectDeadlineField
 * 功能：发布项目表单的「报名截止」日期字段。
 * 实现方法：
 * - 委托 shared/ui/input 的 FormDateInput 渲染
 * 输入：
 * - value / onChange
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { FormDateInput } from '@shared/ui/input'

export interface ProjectDeadlineFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ProjectDeadlineField({ value, onChange, disabled }: ProjectDeadlineFieldProps) {
  return (
    <FormDateInput
      label="报名截止"
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  )
}
