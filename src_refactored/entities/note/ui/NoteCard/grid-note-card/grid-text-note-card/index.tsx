// 01）图文网格笔记卡片（GridTextNoteCard）
import { Link } from 'react-router-dom'
import { memo } from 'react'
import { resolveNoteDetailHref as buildNoteDetailHref } from '@shared/lib/noteRoutes'
import {
  GridNoteCardFooter,
  NoteCardTags,
  type GridNoteCardNote,
} from '../../components'
import { useNoteCardCoverVisibility } from '../../hooks/useNoteCardCoverVisibility'
import {
  resolveGridNoteAuthorFallback,
  resolveGridNoteAuthorText,
} from '../../lib/grid-note-card-utils'
import '../grid-note-card-base.css'
import './grid-text-note-card.css'

export type GridTextNoteCardNote = GridNoteCardNote

function GridTextNoteCard({
  note,
  showAuthor = true,
  showMoreMenu = false,
  onNotInterestedInContent,
  onNotInterestedInAuthor,
}: {
  note: GridTextNoteCardNote
  showAuthor?: boolean
  showMoreMenu?: boolean
  onNotInterestedInContent?: () => void
  onNotInterestedInAuthor?: () => void
}) {
  const noteDetailPath = buildNoteDetailHref({ uid: note.uid, title: note.title, contentType: note.contentType })
  const authorText = showAuthor ? resolveGridNoteAuthorText(note) : ''
  const authorFallback = showAuthor ? resolveGridNoteAuthorFallback(note.authorNickname) : ''
  const coverVisibility = useNoteCardCoverVisibility(note.cover, { onLoadFailure: 'hide' })

  return (
    <Link className="grid-note-card grid-note-card--link grid-text-note-card" to={noteDetailPath}>
      <div
        className={`grid-text-note-card__main ${coverVisibility.shouldRenderCover ? '' : 'grid-text-note-card__main--no-cover'}`.trim()}
      >
        <div className="grid-text-note-card__content">
          <div className="grid-text-note-card__core">
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
            <p className="grid-note-card__summary">{note.summary}</p>
          </div>
          <NoteCardTags tags={note.tags} itemKey={note.uid ?? note.title} maxVisible={6} />
        </div>
        {coverVisibility.shouldRenderCover && coverVisibility.coverSrc ? (
          <div className="grid-text-note-card__cover" aria-hidden="true">
            <img src={coverVisibility.coverSrc} alt="" decoding="async" />
          </div>
        ) : null}
      </div>
      <div className="grid-text-note-card__footer">
        <GridNoteCardFooter
          views={note.views}
          publishTime={note.publishTime}
          updateTime={note.updateTime}
          showMoreMenu={showMoreMenu}
          onNotInterestedInContent={onNotInterestedInContent}
          onNotInterestedInAuthor={onNotInterestedInAuthor}
        />
      </div>
    </Link>
  )
}

export default memo(GridTextNoteCard)
