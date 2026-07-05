// 01）笔记卡片标签列表（NoteCardTags）
import './note-card-tags.css'

// 02）笔记卡片标签 Props（NoteCardTagsProps）
interface NoteCardTagsProps {
  tags: string[]
  itemKey: string
  maxVisible?: number
}

// 03）笔记卡片标签组件（NoteCardTags）
/**
 * 函数名：NoteCardTags
 * 功能：RowNoteCard / GridNoteCard 共用的标签行展示。
 * 实现方法：
 * - 使用绿色胶囊标签样式
 * - 可选 maxVisible 限制展示数量并显示 +N
 * 输入：
 * - tags：标签数组
 * - itemKey：用于 React key 前缀
 * - maxVisible：最多展示标签数，可选
 * 输出：
 * - 返回值：React 节点或 null
 * - 副作用：无
 */
export function NoteCardTags({ tags, itemKey, maxVisible }: NoteCardTagsProps) {
  const normalizedTags = tags.filter(Boolean)
  if (normalizedTags.length === 0) {
    return null
  }

  const visibleTags = maxVisible != null ? normalizedTags.slice(0, maxVisible) : normalizedTags
  const overflowCount = maxVisible != null && normalizedTags.length > maxVisible
    ? normalizedTags.length - maxVisible
    : 0

  return (
    <div className="note-card-tags">
      {visibleTags.map((tag) => (
        <span key={`${itemKey}-${tag}`} className="note-card-tag">
          #{tag}
        </span>
      ))}
      {overflowCount > 0 ? (
        <span className="note-card-tags__overflow">+{overflowCount}</span>
      ) : null}
    </div>
  )
}
