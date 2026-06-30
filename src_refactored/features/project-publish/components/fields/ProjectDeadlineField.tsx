// 01）报名截止日期字段（ProjectDeadlineField）
import { FormDateInput } from '@shared/ui/input'

export interface ProjectDeadlineFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function ProjectDeadlineField({ value, onChange, disabled }: ProjectDeadlineFieldProps) {
  return (
    <FormDateInput
      label="报名截止"
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  )
}
