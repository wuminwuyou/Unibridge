import type { ReactNode } from 'react'
import { BookOpen } from 'lucide-react'
import styles from './ParentNoteEntry.module.css'

// 01）关联笔记卡片 Props（ParentNoteEntryProps）
interface ParentNoteEntryProps {
  children: ReactNode
}

// 02）关联笔记卡片组件（ParentNoteEntry）
/**
 * 函数名：ParentNoteEntry
 * 功能：关联笔记卡片壳，标题为「关联笔记」，内容通过 children slot 注入 RowNoteCard。
 * 输入：
 * - children：注入的笔记行卡片组件
 * 输出：
 * - 返回值：React 节点
 */
export function ParentNoteEntry({ children }: ParentNoteEntryProps) {
  return (
    <div className={styles.parentNoteEntry}>
      <h3 className={styles.parentNoteEntryHeader}>
        <BookOpen size={14} aria-hidden="true" />
        关联笔记
      </h3>
      {children}
    </div>
  )
}
