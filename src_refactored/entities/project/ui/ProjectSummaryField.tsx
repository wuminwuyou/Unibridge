// 01）项目摘要字段（ProjectSummaryField）
/**
 * 函数名：ProjectSummaryField
 * 功能：发布项目表单的「一句话摘要」字段——向 FormInput 原子注入业务文案。
 * 实现方法：
 * - 委托 shared/ui/input 的 FormInput 渲染
 * - 固定 label="一句话摘要"、required 及引导 placeholder
 * 输入：
 * - value / onChange
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { FormInput } from '@shared/ui/input'

export interface ProjectSummaryFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ProjectSummaryField({ value, onChange, disabled }: ProjectSummaryFieldProps) {
  return (
    <FormInput
      label="一句话摘要"
      required
      value={value}
      onChange={onChange}
      placeholder="可留空，未填写时将自动从需求说明提取前 50 字"
      disabled={disabled}
    />
  )
}
