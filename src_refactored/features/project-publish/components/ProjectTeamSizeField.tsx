// 01）团队人数字段（ProjectTeamSizeField）
import { Users } from 'lucide-react'
import { FormIconInput } from '@shared/ui/input'

export interface ProjectTeamSizeFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function ProjectTeamSizeField({ value, onChange, disabled }: ProjectTeamSizeFieldProps) {
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
