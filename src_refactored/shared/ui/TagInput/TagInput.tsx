// 01）标签输入组件（TagInput）
import { useCallback, useState, type KeyboardEvent } from 'react'
import { TagChip } from '@shared/ui/Chip'
import styles from './TagInput.module.css'

// 02）TagInput Props（TagInputProps）
export interface TagInputProps {
  /** 当前标签列表 */
  value: string[]
  /** 标签变更回调 */
  onChange: (tags: string[]) => void
  /** 字段标签 */
  label?: string
  /** 是否必填（仅展示 * 标记） */
  required?: boolean
  /** 输入框占位符 */
  placeholder?: string
  /** 推荐标签（可选，点击切换选中） */
  suggestedTags?: string[]
  /** 最大标签数量，默认不限制 */
  maxTags?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 根节点 className */
  className?: string
}

// 03）规范化单个标签（normalizeTagValue）
function normalizeTagValue(raw: string): string {
  return raw.trim().replace(/^#+/, '')
}

/**
 * 函数名：TagInput
 * 功能：通用标签输入组件，支持回车/逗号添加、chip 展示与删除、可选推荐标签。
 * 实现方法：
 * - 维护内部输入框草稿值
 * - Enter / 逗号 / 添加按钮触发 append
 * - 已选标签以 TagChip 展示，带 × 删除
 * - suggestedTags 区域支持点击切换选中
 * 输入：
 * - value / onChange 及可选 UI 配置
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无（受控组件，状态由父级持有）
 */
export function TagInput({
  value,
  onChange,
  label = '话题标签',
  required = false,
  placeholder = '输入后回车添加',
  suggestedTags,
  maxTags,
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const canAddMore = maxTags == null || value.length < maxTags

  const appendTag = useCallback(
    (raw: string) => {
      const normalized = normalizeTagValue(raw)
      if (!normalized || value.includes(normalized)) {
        return false
      }
      if (maxTags != null && value.length >= maxTags) {
        return false
      }
      onChange([...value, normalized])
      return true
    },
    [maxTags, onChange, value],
  )

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((item) => item !== tag))
    },
    [onChange, value],
  )

  const toggleSuggestedTag = useCallback(
    (tag: string) => {
      if (value.includes(tag)) {
        removeTag(tag)
        return
      }
      if (appendTag(tag)) {
        setInputValue('')
      }
    },
    [appendTag, removeTag, value],
  )

  const commitInput = useCallback(() => {
    if (!inputValue.trim()) {
      return
    }
    if (appendTag(inputValue)) {
      setInputValue('')
    }
  }, [appendTag, inputValue])

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commitInput()
    }
  }

  const handleInputChange = (next: string): void => {
    if (next.includes(',')) {
      const parts = next.split(',')
      const tail = parts.pop() ?? ''
      parts.forEach((part) => {
        appendTag(part)
      })
      setInputValue(tail)
      return
    }
    setInputValue(next)
  }

  return (
    <div className={`${styles.tagInputRoot} ${className ?? ''}`.trim()}>
      {label ? (
        <span className={styles.tagInputLabel}>
          {label}
          {required ? <span className={styles.tagInputRequired}> *</span> : null}
        </span>
      ) : null}

      {value.length > 0 ? (
        <div className={styles.tagInputList} aria-label="已选标签">
          {value.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              selected
              onClick={() => undefined}
              onRemove={disabled ? undefined : () => removeTag(tag)}
            />
          ))}
        </div>
      ) : null}

      <div className={styles.tagInputFieldRow}>
        <input
          type="text"
          className={styles.tagInputField}
          value={inputValue}
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled || !canAddMore}
          aria-label={label || '标签输入'}
        />
        <button
          type="button"
          className={styles.tagInputAddButton}
          onClick={commitInput}
          disabled={disabled || !canAddMore || !inputValue.trim()}
        >
          添加
        </button>
      </div>

      {maxTags != null ? (
        <p className={styles.tagInputHint}>
          已添加 {value.length}/{maxTags} 个标签
        </p>
      ) : null}

      {suggestedTags && suggestedTags.length > 0 ? (
        <div className={styles.tagInputSuggested} aria-label="推荐标签">
          {suggestedTags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              selected={value.includes(tag)}
              onClick={() => {
                if (!disabled) {
                  toggleSuggestedTag(tag)
                }
              }}
            />
          ))}
        </div>
      ) : null}

      {suggestedTags && suggestedTags.length > 0 ? (
        <p className={styles.tagInputHint}>点击推荐标签可快速添加或取消</p>
      ) : null}
    </div>
  )
}
