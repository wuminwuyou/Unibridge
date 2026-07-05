import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ProfileNoteItem } from '../model/profileNoteItem'
import ParentNoteCompactCard from './ParentNoteCompactCard'
import styles from './ParentNoteEntry.module.css'

// 01）关联笔记区块 Props（ParentNoteEntryProps）
interface ParentNoteEntryProps {
  note?: ProfileNoteItem | null
  expanded: boolean
  onToggle: () => void
}

// 02）关联笔记区块组件（ParentNoteEntry）
/**
 * 函数名：ParentNoteEntry
 * 功能：图文阅读器侧栏「关联笔记」可折叠区块；无父笔记时不渲染。
 * 实现方法：
 * - 标题行作为折叠开关，内容区以 grid 高度动画折叠/展开
 * - 展开状态由上层 widget 注入，与学习笔记互斥
 * 输入：
 * - note：父笔记数据，可选
 * - expanded：是否展开
 * - onToggle：切换展开回调
 * 输出：
 * - 返回值：React 节点或 null
 * - 副作用：无
 */
export function ParentNoteEntry({ note, expanded, onToggle }: ParentNoteEntryProps) {
  if (!note?.title?.trim()) {
    return null
  }

  return (
    <div className={styles.parentNoteEntry}>
      <button
        type="button"
        className={styles.parentNoteEntryToggle}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h3 className={styles.parentNoteEntryHeader}>
          <BookOpen size={14} aria-hidden="true" />
          关联笔记
        </h3>
        {expanded ? (
          <ChevronRight size={16} className={styles.parentNoteEntryChevron} aria-hidden="true" />
        ) : (
          <ChevronLeft size={16} className={styles.parentNoteEntryChevron} aria-hidden="true" />
        )}
      </button>
      <div
        className={`${styles.parentNoteEntryBodyWrap} ${expanded ? styles.parentNoteEntryBodyWrapExpanded : styles.parentNoteEntryBodyWrapCollapsed}`}
        aria-hidden={!expanded}
      >
        <div className={styles.parentNoteEntryBody}>
          <ParentNoteCompactCard note={note} />
        </div>
      </div>
    </div>
  )
}
