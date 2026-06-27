import { buildNoteDetailHref } from '../../../../pages/NoteReader'
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
  showAuthor?: boolean
}

// 03）视频网格笔记卡片组件（GridVideoNoteCard）
/**
 * 函数名：GridVideoNoteCard
 * 功能：渲染视频笔记网格卡片；封面区展示时长与播放图标，正文区展示标题与页脚。
 * 输入：
 * - note：笔记卡片数据对象
 * - showAuthor：是否展示作者信息，默认 true
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function GridVideoNoteCard({ note, showAuthor = true }: GridVideoNoteCardProps) {
  const noteDetailPath = buildNoteDetailHref({
    uid: note.uid,
    title: note.title,
    contentType: note.contentType,
  })
  const typeBadgeLabel = resolveGridNoteTypeBadge('视频')
  const authorText = showAuthor ? resolveGridNoteAuthorText(note) : ''
  const authorFallback = showAuthor ? resolveGridNoteAuthorFallback(note.authorNickname) : ''
  const videoDuration = resolveGridNoteVideoDuration(note.videoDuration)

  return (
    <Link
      className="grid-note-card grid-note-card--link grid-video-note-card"
      to={noteDetailPath}
    >
      <GridNoteCardMenuButton />

      <div className="grid-note-card__cover grid-video-note-card__media">
        <img className="grid-video-note-card__media-cover" src={note.cover} alt="" loading="lazy" decoding="async" />
        <span className="grid-video-note-card__media-overlay" aria-hidden="true" />
        <span className="grid-video-note-card__type-badge">
          <Video size={12} aria-hidden="true" />
          {typeBadgeLabel}
        </span>
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
          comments={note.comments}
          favorites={note.favorites}
          publishTime={note.publishTime}
        />
      </div>
    </Link>
  )
}

export default memo(GridVideoNoteCard)
