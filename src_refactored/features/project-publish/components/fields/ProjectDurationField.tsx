// 01）预计周期字段（ProjectDurationField）
import { Clock3 } from 'lucide-react'
import { FormIconInput } from '@shared/ui/input'

export interface ProjectDurationFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function ProjectDurationField({ value, onChange, disabled }: ProjectDurationFieldProps) {
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
