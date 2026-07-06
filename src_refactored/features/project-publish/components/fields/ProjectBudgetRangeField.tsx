// 01）项目预算区间字段（ProjectBudgetRangeField）
// 左右两个数字输入框：最小值 / 最大值，严格限制仅可输入数字
import { FormInput } from '@shared/ui/input'

export interface ProjectBudgetRangeFieldProps {
  minValue: string
  maxValue: string
  onMinChange: (v: string) => void
  onMaxChange: (v: string) => void
  disabled?: boolean
}

/** 过滤非数字字符，仅保留 0-9 */
function sanitizeNumeric(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

export function ProjectBudgetRangeField({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  disabled,
}: ProjectBudgetRangeFieldProps) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <FormInput
          label="预算最小值"
          required
          value={minValue}
          onChange={(v) => onMinChange(sanitizeNumeric(v))}
          placeholder="最低预算（元）"
          disabled={disabled}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <FormInput
          label="预算最大值"
          required
          value={maxValue}
          onChange={(v) => onMaxChange(sanitizeNumeric(v))}
          placeholder="最高预算（元）"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
