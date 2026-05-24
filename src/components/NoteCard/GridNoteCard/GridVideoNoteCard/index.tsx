import pauseIconUrl from '../../../../assets/Pause.svg'
import { buildNoteDetailHref } from '../../../../pages/NoteDetailPage/shared/noteDetailRouting'
import { Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import {
  resolveGridNoteAuthorFallback,
  resolveGridNoteAuthorText,
  resolveGridNoteTypeBadge,
  resolveGridNoteVideoDuration,
} from '../gridNoteCardUtils'
import {
  GridNoteCardAuthor,
  GridNoteCardFooter,
  GridNoteCardMenuButton,
  type GridNoteCardNote,
} from '../gridNoteCardShared'
import '../gridNoteCardBase.css'
import './GridVideoNoteCard.css'

export type GridVideoNoteCardNote = GridNoteCardNote

interface GridVideoNoteCardProps {
  note: GridVideoNoteCardNote
}

function GridVideoNoteCard({ note }: GridVideoNoteCardProps) {
  const noteDetailPath = buildNoteDetailHref({
    id: note.id,
    title: note.title,
    contentType: note.contentType,
  })
  const typeBadgeLabel = resolveGridNoteTypeBadge('视频')
  const authorText = resolveGridNoteAuthorText(note)
  const authorFallback = resolveGridNoteAuthorFallback(note.authorName)
  const videoDuration = resolveGridNoteVideoDuration(note.videoDuration)

  return (
    <Link
      className="grid-note-card grid-note-card--link grid-video-note-card"
      to={noteDetailPath}
      target="_blank"
      rel="noopener noreferrer"
    >
      <GridNoteCardMenuButton />

      <div className="grid-note-card__cover grid-video-note-card__media">
        <img className="grid-video-note-card__media-cover" src={note.cover} alt="" loading="lazy" decoding="async" />
        <span className="grid-video-note-card__media-overlay" aria-hidden="true" />
        <span className="grid-video-note-card__type-badge">
          <Video size={12} aria-hidden="true" />
          {typeBadgeLabel}
        </span>
        <img className="grid-video-note-card__media-icon" src={pauseIconUrl} alt="" aria-hidden="true" />
        <span className="grid-video-note-card__media-duration">{videoDuration}</span>
      </div>

      <div className="grid-note-card__body grid-video-note-card__body">
        <h3 className="grid-note-card__title">{note.title}</h3>
        <GridNoteCardAuthor
          authorAvatar={note.authorAvatar}
          authorFallback={authorFallback}
          authorText={authorText}
        />
        <GridNoteCardFooter
          views={note.views}
          comments={note.comments}
          favorites={note.favorites}
          publishTime={note.publishTime}
        />
      </div>
    </Link>
  )
}

export default memo(GridVideoNoteCard)
