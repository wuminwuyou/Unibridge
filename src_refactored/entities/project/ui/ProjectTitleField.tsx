// 01）项目标题字段（ProjectTitleField）
/**
 * 函数名：ProjectTitleField
 * 功能：发布项目表单的「项目标题」字段——向 FormInput 原子注入业务文案。
 * 实现方法：
 * - 委托 shared/ui/input 的 FormInput 渲染
 * - 固定 label="项目标题"、required 及 placeholder
 * 输入：
 * - value / onChange
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { FormInput } from '@shared/ui/input'

export interface ProjectTitleFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ProjectTitleField({ value, onChange, disabled }: ProjectTitleFieldProps) {
  return (
    <FormInput
      label="项目标题"
      required
      value={value}
      onChange={onChange}
      placeholder="例如：电商平台用户增长数据分析"
      disabled={disabled}
    />
  )
}
