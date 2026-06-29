// 01）项目能力等级字段（ProjectLevelField）
/**
 * 函数名：ProjectLevelField
 * 功能：发布项目表单的「能力等级」下拉字段。
 * 实现方法：
 * - 委托 shared/ui/input 的 FormSelectInput 渲染
 * - 选项来自 publishLevelOptions
 * 输入：
 * - value / onChange / options
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { FormSelectInput } from '@shared/ui/input'

export interface ProjectLevelFieldProps {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function ProjectLevelField({ value, options, onChange, disabled }: ProjectLevelFieldProps) {
  return (
    <FormSelectInput
      label="能力等级"
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
    />
  )
}
