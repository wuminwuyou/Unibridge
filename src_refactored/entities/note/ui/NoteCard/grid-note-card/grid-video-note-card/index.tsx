// 01）视频网格笔记卡片（GridVideoNoteCard）
import { ImageOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import { resolveNoteDetailHref as buildNoteDetailHref } from '@shared/lib/noteRoutes'
import {
  GridNoteCardAuthor,
  GridNoteCardFooter,
  type GridNoteCardNote,
} from '../../components'
import { useNoteCardCoverVisibility } from '../../hooks/useNoteCardCoverVisibility'
import {
  resolveGridNoteAuthorFallback,
  resolveGridNoteAuthorText,
  resolveGridNoteVideoDuration,
} from '../../lib/grid-note-card-utils'
import '../grid-note-card-base.css'
import './grid-video-note-card.css'

export type GridVideoNoteCardNote = GridNoteCardNote

function GridVideoNoteCard({
  note,
  showAuthor = true,
  showMoreMenu = false,
  onNotInterestedInContent,
  onNotInterestedInAuthor,
}: {
  note: GridVideoNoteCardNote
  showAuthor?: boolean
  showMoreMenu?: boolean
  onNotInterestedInContent?: () => void
  onNotInterestedInAuthor?: () => void
}) {
  const noteDetailPath = buildNoteDetailHref({ uid: note.uid, title: note.title, contentType: note.contentType })
  const authorText = showAuthor ? resolveGridNoteAuthorText(note) : ''
  const authorFallback = showAuthor ? resolveGridNoteAuthorFallback(note.authorNickname) : ''
  const videoDuration = resolveGridNoteVideoDuration(note.videoDuration)
  const coverVisibility = useNoteCardCoverVisibility(note.cover, { onLoadFailure: 'placeholder' })
  const showCoverLoadFailed =
    coverVisibility.showPlaceholder && !coverVisibility.isCoverLoading && !coverVisibility.coverSrc

  return (
    <Link className="grid-note-card grid-note-card--link grid-video-note-card" to={noteDetailPath}>
      <div
        className={`grid-note-card__cover grid-video-note-card__media ${coverVisibility.showPlaceholder ? 'grid-video-note-card__media--placeholder' : ''}`.trim()}
        aria-hidden="true"
      >
        {coverVisibility.coverSrc ? (
          <img
            className="grid-video-note-card__media-cover"
            src={coverVisibility.coverSrc}
            alt=""
            loading="eager"
            decoding="async"
          />
        ) : null}
        {showCoverLoadFailed ? (
          <span className="grid-video-note-card__media-fallback" aria-hidden="true">
            <ImageOff />
          </span>
        ) : null}
        {!coverVisibility.showPlaceholder ? (
          <span className="grid-video-note-card__media-overlay" aria-hidden="true" />
        ) : null}
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
          showMoreMenu={showMoreMenu}
          onNotInterestedInContent={onNotInterestedInContent}
          onNotInterestedInAuthor={onNotInterestedInAuthor}
        />
      </div>
    </Link>
  )
}

export default memo(GridVideoNoteCard)
