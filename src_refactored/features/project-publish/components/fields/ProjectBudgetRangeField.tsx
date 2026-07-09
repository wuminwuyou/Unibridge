// 01）项目预算区间字段（ProjectBudgetRangeField）
// 左右两个数字输入框：最小值 / 最大值，严格限制仅可输入数字，失焦时校验 min < max
import { useState, useCallback } from 'react'
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
  return value.replace(/\D/g, '')
}

// 02）校验预算区间合法性（validateBudgetRange）
/**
 * 函数名：validateBudgetRange
 * 功能：检查最小值和最大值是否合法（非空、均为正整数、min < max）。
 * 输入：
 * - minStr / maxStr：原始字符串值
 * 输出：
 * - 返回值：string | null（错误消息或 null）
 * - 副作用：无
 */
function validateBudgetRange(minStr: string, maxStr: string): string | null {
  if (!minStr.trim() || !maxStr.trim()) return null // 未完整填写时不提示
  const min = parseInt(minStr, 10)
  const max = parseInt(maxStr, 10)
  if (Number.isNaN(min) || Number.isNaN(max)) return null
  if (min <= 0) return '预算最小值必须大于 0'
  if (max <= 0) return '预算最大值必须大于 0'
  if (min >= max) return '预算最小值必须小于最大值'
  return null
}

export function ProjectBudgetRangeField({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  disabled,
}: ProjectBudgetRangeFieldProps) {
  const [error, setError] = useState<string | null>(null)

  // 03）失焦时校验（仅当两个字段均已填写）
  const handleBlur = useCallback(() => {
    if (minValue.trim() || maxValue.trim()) {
      setError(validateBudgetRange(minValue, maxValue))
    } else {
      setError(null)
    }
  }, [minValue, maxValue])

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FormInput
            label="预算最小值"
            required
            value={minValue}
            onChange={(v) => { onMinChange(sanitizeNumeric(v)); setError(null) }}
            onBlur={handleBlur}
            placeholder="最低预算（元）"
            disabled={disabled}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FormInput
            label="预算最大值"
            required
            value={maxValue}
            onChange={(v) => { onMaxChange(sanitizeNumeric(v)); setError(null) }}
            onBlur={handleBlur}
            placeholder="最高预算（元）"
            disabled={disabled}
          />
        </div>
      </div>
      {error && (
        <p style={{ margin: '0.375rem 0 0', fontSize: '0.8125rem', color: '#dc2626' }}>
          {error}
        </p>
      )}
    </div>
  )
}
