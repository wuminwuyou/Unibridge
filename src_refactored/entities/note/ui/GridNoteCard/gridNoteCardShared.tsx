import type { ProfileNoteItem } from '../../model/profileNoteItem'
import { Eye, Heart, MoreHorizontal, ThumbsUp } from 'lucide-react'
import { type MouseEvent } from 'react'
import { formatGridNoteMetricCount, resolveGridNoteRelativeTime } from './gridNoteCardUtils'

export type GridNoteCardNote = ProfileNoteItem

export function stopGridNoteCardMenuNavigation(event: MouseEvent<HTMLButtonElement>): void { event.preventDefault(); event.stopPropagation() }

export function GridNoteCardMenuButton({ className }: { className?: string }) {
  return <button type="button" className={className ? `grid-note-card__menu ${className}` : 'grid-note-card__menu'} aria-label="更多操作" onClick={stopGridNoteCardMenuNavigation}><MoreHorizontal size={16} aria-hidden="true" /></button>
}

export function GridNoteCardFooter({ views, comments, favorites, publishTime }: { views: number; comments: number; favorites: number; publishTime: string }) {
  return (
    <div className="grid-note-card__footer">
      <div className="grid-note-card__stats">
        <span className="grid-note-card__stat"><Eye size={14} aria-hidden="true" />{formatGridNoteMetricCount(views)}</span>
        <span className="grid-note-card__stat"><Heart size={14} aria-hidden="true" />{formatGridNoteMetricCount(favorites)}</span>
        <span className="grid-note-card__stat"><ThumbsUp size={14} aria-hidden="true" />{formatGridNoteMetricCount(comments)}</span>
      </div>
      <span className="grid-note-card__time">{resolveGridNoteRelativeTime(publishTime)}</span>
    </div>
  )
}

export function GridNoteCardAuthor({ authorAvatar, authorFallback, authorText }: { authorAvatar?: string; authorFallback: string; authorText: string }) {
  return (
    <div className="grid-note-card__author">
      {authorAvatar ? <img className="grid-note-card__author-avatar" src={authorAvatar} alt="" loading="lazy" />
      : <span className="grid-note-card__author-avatar">{authorFallback}</span>}
      <span className="grid-note-card__author-text">{authorText}</span>
    </div>
  )
}
