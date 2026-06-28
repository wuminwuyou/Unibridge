import { memo } from 'react'
import GridTextNoteCard from './GridTextNoteCard'
import GridVideoNoteCard from './GridVideoNoteCard'
import type { GridNoteCardNote } from './gridNoteCardShared'
export type { GridNoteCardNote } from './gridNoteCardShared'

function GridNoteCard({ note, showAuthor = true }: { note: GridNoteCardNote; showAuthor?: boolean }) {
  if (note.contentType === '视频') return <GridVideoNoteCard note={note} showAuthor={showAuthor} />
  return <GridTextNoteCard note={note} showAuthor={showAuthor} />
}
export default memo(GridNoteCard)
