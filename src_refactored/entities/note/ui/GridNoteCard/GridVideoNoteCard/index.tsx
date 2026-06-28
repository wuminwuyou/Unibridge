// 01）视频网格笔记卡片（GridVideoNoteCard）
import { Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import { resolveGridNoteAuthorFallback, resolveGridNoteAuthorText, resolveGridNoteTypeBadge, resolveGridNoteVideoDuration } from '../gridNoteCardUtils'
import { GridNoteCardAuthor, GridNoteCardFooter, GridNoteCardMenuButton, type GridNoteCardNote } from '../gridNoteCardShared'
import '../gridNoteCardBase.css'
import './GridVideoNoteCard.css'
import { buildNoteDetailHref } from '../../../model/noteDetailRouting'

export type GridVideoNoteCardNote = GridNoteCardNote

function GridVideoNoteCard({ note, showAuthor = true }: { note: GridVideoNoteCardNote; showAuthor?: boolean }) {
  const noteDetailPath = buildNoteDetailHref({ uid: note.uid, title: note.title, contentType: note.contentType })
  const typeBadgeLabel = resolveGridNoteTypeBadge('视频')
  const authorText = showAuthor ? resolveGridNoteAuthorText(note) : ''
  const authorFallback = showAuthor ? resolveGridNoteAuthorFallback(note.authorNickname) : ''
  const videoDuration = resolveGridNoteVideoDuration(note.videoDuration)

  return (
    <Link className="grid-note-card grid-note-card--link grid-video-note-card" to={noteDetailPath}>
      <GridNoteCardMenuButton />
      <div className="grid-note-card__cover grid-video-note-card__media">
        <img className="grid-video-note-card__media-cover" src={note.cover} alt="" loading="lazy" decoding="async" />
        <span className="grid-video-note-card__media-overlay" aria-hidden="true" />
        <span className="grid-video-note-card__type-badge"><Video size={12} aria-hidden="true" />{typeBadgeLabel}</span>
        <span className="grid-video-note-card__media-duration">{videoDuration}</span>
      </div>
      <div className="grid-note-card__body grid-video-note-card__body">
        <h3 className="grid-note-card__title">{note.title}</h3>
        {showAuthor ? <GridNoteCardAuthor authorAvatar={note.authorAvatar} authorFallback={authorFallback} authorText={authorText} /> : null}
        <GridNoteCardFooter views={note.views} comments={note.comments} favorites={note.favorites} publishTime={note.publishTime} />
      </div>
    </Link>
  )
}

export default memo(GridVideoNoteCard)
