// 01）技能标签编辑器交互组件（SkillTagsEditor）
/**
 * 函数名：SkillTagsEditor
 * 功能：管理技能标签的添加、移除、建议标签切换——组合 shared/ui/Chip/TagChip 原子。
 * 输入：
 * - tags / tagInput / suggestedTags / onAdd / onRemove / onTagInputChange / onToggleSuggested / onTagInputKeyDown
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
import { TagChip } from '@shared/ui/Chip'
import { Tag } from 'lucide-react'
import styles from './SkillTagsEditor.module.css'

export interface SkillTagsEditorProps {
  tags: string[]
  tagInput: string
  suggestedTags: string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  onTagInputChange: (value: string) => void
  onToggleSuggested: (tag: string) => void
  onTagInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

export function SkillTagsEditor({
  tags,
  tagInput,
  suggestedTags,
  onAdd,
  onRemove,
  onTagInputChange,
  onToggleSuggested,
  onTagInputKeyDown,
}: SkillTagsEditorProps) {
  return (
    <div className={styles.root}>
      <span className={styles.label}>
        技能标签（请按照重要程度由深入浅排序）<span className={styles.danger}>*</span>
      </span>
      <div className={styles.chipList}>
        {tags.map((tag) => (
          <TagChip
            key={tag}
            label={tag}
            selected
            onClick={() => onRemove(tag)}
            onRemove={() => onRemove(tag)}
          />
        ))}
      </div>
      <div className={styles.inputRow}>
        <input
          type="text"
          value={tagInput}
          onChange={(event) => onTagInputChange(event.target.value)}
          onKeyDown={onTagInputKeyDown}
          placeholder="输入后回车添加"
          className={styles.input}
        />
        <button type="button" onClick={() => onAdd(tagInput)} className={styles.button}>
          添加
        </button>
      </div>
      <div className={styles.chipList}>
        {suggestedTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleSuggested(tag)}
            className={`${styles.suggestedChip} ${tags.includes(tag) ? styles.suggestedChipSelected : ''}`.trim()}
          >
            <Tag className={styles.tagIcon} />
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}
