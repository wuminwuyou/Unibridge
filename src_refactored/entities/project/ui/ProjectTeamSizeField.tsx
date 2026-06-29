// 01）项目团队人数字段（ProjectTeamSizeField）
/**
 * 函数名：ProjectTeamSizeField
 * 功能：发布项目表单的「团队人数」字段——带 Users 图标。
 * 实现方法：
 * - 委托 shared/ui/input 的 FormIconInput 渲染
 * 输入：
 * - value / onChange
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { Users } from 'lucide-react'
import { FormIconInput } from '@shared/ui/input'

export interface ProjectTeamSizeFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ProjectTeamSizeField({ value, onChange, disabled }: ProjectTeamSizeFieldProps) {
  return (
    <FormIconInput
      label="团队人数"
      value={value}
      onChange={onChange}
      placeholder="例如：1-3 人"
      disabled={disabled}
      icon={<Users />}
    />
  )
}
