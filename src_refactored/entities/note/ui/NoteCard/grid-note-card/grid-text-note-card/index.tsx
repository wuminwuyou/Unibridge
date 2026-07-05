// 01）图文网格笔记卡片（GridTextNoteCard）
import { Eye, Heart, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import { formatMetricCount } from '@shared/lib'
import { buildNoteDetailHref } from '../../../../model/noteDetailRouting'
import { GridNoteCardMenuButton, NoteCardTags, type GridNoteCardNote } from '../../components'
import {
  resolveGridNoteAuthorFallback,
  resolveGridNoteAuthorText,
  resolveGridNoteRelativeTime,
} from '../../lib/grid-note-card-utils'
import '../grid-note-card-base.css'
import './grid-text-note-card.css'

export type GridTextNoteCardNote = GridNoteCardNote

function GridTextNoteCard({ note, showAuthor = true }: { note: GridTextNoteCardNote; showAuthor?: boolean }) {
  const noteDetailPath = buildNoteDetailHref({ uid: note.uid, title: note.title, contentType: note.contentType })
  const authorText = showAuthor ? resolveGridNoteAuthorText(note) : ''
  const authorFallback = showAuthor ? resolveGridNoteAuthorFallback(note.authorNickname) : ''

  return (
    <Link className="grid-note-card grid-note-card--link grid-text-note-card" to={noteDetailPath}>
      <GridNoteCardMenuButton />
      <div className="flex flex-row h-full w-full overflow-hidden">
        <div className="w-[60%] flex flex-col justify-between h-full p-4 min-w-0">
          <div className="space-y-1.5 min-w-0">
            <h3 className="grid-note-card__title">{note.title}</h3>
            {showAuthor ? (
              <div className="grid-note-card__author">
                {note.authorAvatar ? (
                  <img className="grid-note-card__author-avatar" src={note.authorAvatar} alt="" loading="lazy" />
                ) : (
                  <span className="grid-note-card__author-avatar">{authorFallback}</span>
                )}
                <span className="grid-note-card__author-text">{authorText}</span>
              </div>
            ) : null}
            <p className="m-0 text-[14px] leading-relaxed text-[#475569] dark:text-[#cbd5e1] overflow-hidden line-clamp-3 break-words min-h-0">
              {note.summary}
            </p>
          </div>
          <div className="space-y-2 min-w-0 flex-shrink-0">
            <NoteCardTags tags={note.tags} itemKey={note.uid ?? note.title} maxVisible={6} />
            <div className="grid-note-card__footer">
              <div className="grid-note-card__stats">
                <span className="grid-note-card__stat">
                  <Eye size={14} aria-hidden="true" />
                  {formatMetricCount(note.views)}
                </span>
                <span className="grid-note-card__stat">
                  <Heart size={14} aria-hidden="true" />
                  {formatMetricCount(note.favorites)}
                </span>
                <span className="grid-note-card__stat">
                  <ThumbsUp size={14} aria-hidden="true" />
                  {formatMetricCount(note.comments)}
                </span>
              </div>
              <span className="grid-note-card__time">{resolveGridNoteRelativeTime(note.publishTime)}</span>
            </div>
          </div>
        </div>
        <div className="w-[40%] h-full flex-shrink-0">
          <img className="w-full h-full object-cover block" src={note.cover} alt="" loading="lazy" decoding="async" />
        </div>
      </div>
    </Link>
  )
}

export default memo(GridTextNoteCard)
