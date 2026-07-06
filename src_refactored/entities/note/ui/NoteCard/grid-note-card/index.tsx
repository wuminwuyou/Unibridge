// 01）网格笔记卡片入口（GridNoteCard）
import { memo } from 'react'
import type { GridNoteCardNote } from '../components'
import GridTextNoteCard from './grid-text-note-card'
import GridVideoNoteCard from './grid-video-note-card'

export type { GridNoteCardNote } from '../components'

// 02）网格笔记卡片 Props（GridNoteCardProps）
export interface GridNoteCardProps {
  note: GridNoteCardNote
  showAuthor?: boolean
  /** 是否展示 Footer 更多菜单（ProfileSpace 内应为 false） */
  showMoreMenu?: boolean
  onNotInterestedInContent?: () => void
  onNotInterestedInAuthor?: () => void
}

function GridNoteCard({
  note,
  showAuthor = true,
  showMoreMenu = false,
  onNotInterestedInContent,
  onNotInterestedInAuthor,
}: GridNoteCardProps) {
  const menuProps = {
    showMoreMenu,
    onNotInterestedInContent,
    onNotInterestedInAuthor,
  }

  if (note.contentType === '视频') {
    return <GridVideoNoteCard note={note} showAuthor={showAuthor} {...menuProps} />
  }
  return <GridTextNoteCard note={note} showAuthor={showAuthor} {...menuProps} />
}

export default memo(GridNoteCard)
