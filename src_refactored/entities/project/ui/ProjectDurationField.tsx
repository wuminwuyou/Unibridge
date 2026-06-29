// 01）项目周期字段（ProjectDurationField）
/**
 * 函数名：ProjectDurationField
 * 功能：发布项目表单的「预计周期」字段——带时钟图标。
 * 实现方法：
 * - 委托 shared/ui/input 的 FormIconInput 渲染
 * - 前置 Clock3 图标
 * 输入：
 * - value / onChange
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { Clock3 } from 'lucide-react'
import { FormIconInput } from '@shared/ui/input'

export interface ProjectDurationFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ProjectDurationField({ value, onChange, disabled }: ProjectDurationFieldProps) {
  return (
    <FormIconInput
      label="预计周期"
      value={value}
      onChange={onChange}
      placeholder="例如：4 周"
      disabled={disabled}
      icon={<Clock3 />}
    />
  )
}
