// 01）网格笔记卡片入口（GridNoteCard）
import { memo } from 'react'
import type { GridNoteCardNote } from '../components'
import GridTextNoteCard from './grid-text-note-card'
import GridVideoNoteCard from './grid-video-note-card'

export type { GridNoteCardNote } from '../components'

function GridNoteCard({ note, showAuthor = true }: { note: GridNoteCardNote; showAuthor?: boolean }) {
  if (note.contentType === '视频') {
    return <GridVideoNoteCard note={note} showAuthor={showAuthor} />
  }
  return <GridTextNoteCard note={note} showAuthor={showAuthor} />
}

export default memo(GridNoteCard)
