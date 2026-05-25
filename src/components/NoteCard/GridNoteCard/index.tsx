import { memo } from 'react'
import GridTextNoteCard from './GridTextNoteCard'
import GridVideoNoteCard from './GridVideoNoteCard'
import type { GridNoteCardNote } from './gridNoteCardShared'

export type { GridNoteCardNote } from './gridNoteCardShared'
export type { GridTextNoteCardNote } from './GridTextNoteCard'
export type { GridVideoNoteCardNote } from './GridVideoNoteCard'
export { default as GridTextNoteCard } from './GridTextNoteCard'
export { default as GridVideoNoteCard } from './GridVideoNoteCard'

// 01）网格笔记卡片参数（GridNoteCardProps）
interface GridNoteCardProps {
  note: GridNoteCardNote
  /** 是否展示作者头像与昵称，默认 true */
  showAuthor?: boolean
}

// 02）网格笔记卡片分发组件（GridNoteCard）
/**
 * 函数名：GridNoteCard
 * 功能：按 contentType 分发至 GridTextNoteCard 或 GridVideoNoteCard。
 * 实现方法：
 * - contentType 为「视频」时渲染 GridVideoNoteCard
 * - 其余情况渲染 GridTextNoteCard
 * - showAuthor 为 false 时不渲染作者栏（如个人空间）
 * 输入：
 * - note：笔记卡片数据对象
 * - showAuthor：是否展示作者信息，默认 true
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function GridNoteCard({ note, showAuthor = true }: GridNoteCardProps) {
  if (note.contentType === '视频') {
    return <GridVideoNoteCard note={note} showAuthor={showAuthor} />
  }

  return <GridTextNoteCard note={note} showAuthor={showAuthor} />
}

export default memo(GridNoteCard)
