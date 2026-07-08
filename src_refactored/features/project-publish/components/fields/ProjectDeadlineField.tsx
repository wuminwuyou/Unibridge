// 01）报名截止日期字段（ProjectDeadlineField）
// 限制最小日期为明天，防止用户选今天或更早
import { useMemo } from 'react'
import { FormDateInput } from '@shared/ui/input'

export interface ProjectDeadlineFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

// 02）计算明天日期（YYYY-MM-DD）
function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function ProjectDeadlineField({ value, onChange, disabled }: ProjectDeadlineFieldProps) {
  const minDate = useMemo(() => getTomorrow(), [])

  return (
    <FormDateInput
      label="项目招募截止日期"
      value={value}
      min={minDate}
      onChange={onChange}
      disabled={disabled}
    />
  )
}
