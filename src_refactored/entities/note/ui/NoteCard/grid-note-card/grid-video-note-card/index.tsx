// 01）视频网格笔记卡片（GridVideoNoteCard）
import { Link } from 'react-router-dom'
import { memo } from 'react'
import { buildNoteDetailHref } from '../../../../model/noteDetailRouting'
import {
  GridNoteCardAuthor,
  GridNoteCardFooter,
  GridNoteCardMenuButton,
  type GridNoteCardNote,
} from '../../components'
import {
  resolveGridNoteAuthorFallback,
  resolveGridNoteAuthorText,
  resolveGridNoteVideoDuration,
} from '../../lib/grid-note-card-utils'
import '../grid-note-card-base.css'
import './grid-video-note-card.css'

export type GridVideoNoteCardNote = GridNoteCardNote

function GridVideoNoteCard({ note, showAuthor = true }: { note: GridVideoNoteCardNote; showAuthor?: boolean }) {
  const noteDetailPath = buildNoteDetailHref({ uid: note.uid, title: note.title, contentType: note.contentType })
  const authorText = showAuthor ? resolveGridNoteAuthorText(note) : ''
  const authorFallback = showAuthor ? resolveGridNoteAuthorFallback(note.authorNickname) : ''
  const videoDuration = resolveGridNoteVideoDuration(note.videoDuration)

  return (
    <Link className="grid-note-card grid-note-card--link grid-video-note-card" to={noteDetailPath}>
      <GridNoteCardMenuButton />
      <div className="grid-note-card__cover grid-video-note-card__media">
        <img className="grid-video-note-card__media-cover" src={note.cover} alt="" loading="lazy" decoding="async" />
        <span className="grid-video-note-card__media-overlay" aria-hidden="true" />
        <span className="grid-video-note-card__media-duration">{videoDuration}</span>
      </div>
      <div className="grid-note-card__body grid-video-note-card__body">
        <h3 className="grid-note-card__title">{note.title}</h3>
        {showAuthor ? (
          <GridNoteCardAuthor
            authorAvatar={note.authorAvatar}
            authorFallback={authorFallback}
            authorText={authorText}
          />
        ) : null}
        <GridNoteCardFooter
          views={note.views}
          publishTime={note.publishTime}
          updateTime={note.updateTime}
        />
      </div>
    </Link>
  )
}

export default memo(GridVideoNoteCard)
