// 01）图文网格笔记卡片（GridTextNoteCard）
import { Eye, Heart, MessageCircleMore, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import { resolveGridNoteAuthorFallback, resolveGridNoteAuthorText, resolveGridNoteTypeBadge, formatGridNoteMetricCount, resolveGridNoteRelativeTime } from '../gridNoteCardUtils'
import { GridNoteCardMenuButton, type GridNoteCardNote } from '../gridNoteCardShared'
import '../gridNoteCardBase.css'
import './GridTextNoteCard.css'
import { buildNoteDetailHref } from '../../../model/noteDetailRouting'

export type GridTextNoteCardNote = GridNoteCardNote

function GridTextNoteCard({ note, showAuthor = true }: { note: GridTextNoteCardNote; showAuthor?: boolean }) {
  const noteDetailPath = buildNoteDetailHref({ uid: note.uid, title: note.title, contentType: note.contentType })
  const typeBadgeLabel = resolveGridNoteTypeBadge('图文')
  const authorText = showAuthor ? resolveGridNoteAuthorText(note) : ''
  const authorFallback = showAuthor ? resolveGridNoteAuthorFallback(note.authorNickname) : ''

  return (
    <Link className="grid-note-card grid-note-card--link grid-text-note-card" to={noteDetailPath}>
      <GridNoteCardMenuButton />
      <div className="flex flex-row h-full w-full overflow-hidden">
        <div className="w-[60%] flex flex-col justify-between h-full p-4 min-w-0">
          <div className="space-y-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 self-start flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-relaxed whitespace-nowrap bg-[#eff6ff] text-[#3b82f6] dark:bg-[#1e3a8a] dark:text-[#60a5fa]">
              <MessageCircleMore size={12} aria-hidden="true" />{typeBadgeLabel}
            </span>
            <h3 className="grid-note-card__title">{note.title}</h3>
            {showAuthor ? (
              <div className="grid-note-card__author">
                {note.authorAvatar ? <img className="grid-note-card__author-avatar" src={note.authorAvatar} alt="" loading="lazy" /> : <span className="grid-note-card__author-avatar">{authorFallback}</span>}
                <span className="grid-note-card__author-text">{authorText}</span>
              </div>
            ) : null}
            <p className="m-0 text-[14px] leading-relaxed text-[#475569] dark:text-[#cbd5e1] overflow-hidden line-clamp-3 break-words min-h-0">{note.summary}</p>
          </div>
          <div className="space-y-2 min-w-0 flex-shrink-0">
            {note.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1 overflow-hidden max-h-[3.0rem]">
                {note.tags.slice(0, 6).map((tag) => <span key={`${note.title}-${tag}`} className="inline-block rounded-md bg-[#f1f5f9] dark:bg-[#334155] px-2 py-0.5 text-[11px] leading-relaxed text-[#64748b] dark:text-[#94a3b8] whitespace-nowrap">#{tag}</span>)}
                {note.tags.length > 6 ? <span className="inline-block text-[11px] leading-relaxed text-[#94a3b8] self-center">+{note.tags.length - 6}</span> : null}
              </div>
            ) : null}
            <div className="grid-note-card__footer">
              <div className="grid-note-card__stats">
                <span className="grid-note-card__stat"><Eye size={14} aria-hidden="true" />{formatGridNoteMetricCount(note.views)}</span>
                <span className="grid-note-card__stat"><Heart size={14} aria-hidden="true" />{formatGridNoteMetricCount(note.favorites)}</span>
                <span className="grid-note-card__stat"><ThumbsUp size={14} aria-hidden="true" />{formatGridNoteMetricCount(note.comments)}</span>
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
