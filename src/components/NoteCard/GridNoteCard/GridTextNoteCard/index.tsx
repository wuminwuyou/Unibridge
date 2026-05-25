import { buildNoteDetailHref } from '../../../../pages/NoteReader/shared/noteDetailRouting'
import { MessageCircleMore } from 'lucide-react'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import {
  resolveGridNoteAuthorFallback,
  resolveGridNoteAuthorText,
  resolveGridNoteTypeBadge,
} from '../gridNoteCardUtils'
import {
  GridNoteCardAuthor,
  GridNoteCardFooter,
  GridNoteCardMenuButton,
  type GridNoteCardNote,
} from '../gridNoteCardShared'
import '../gridNoteCardBase.css'
import './GridTextNoteCard.css'

// 01）图文网格笔记卡片数据（GridTextNoteCardNote）
export type GridTextNoteCardNote = GridNoteCardNote

// 02）图文网格笔记卡片参数（GridTextNoteCardProps）
interface GridTextNoteCardProps {
  note: GridTextNoteCardNote
  showAuthor?: boolean
}

// 03）图文网格笔记卡片组件（GridTextNoteCard）
/**
 * 函数名：GridTextNoteCard
 * 功能：渲染左文右图网格笔记卡片；封面区撑满卡片高度，页脚区仅保留指标行高度。
 * 实现方法：
 * - 上方 grid-note-card__cover：6:4 分栏，右侧封面在边距内填满右侧区域
 * - 下方 grid-note-card__body：全宽页脚（社交指标 + 发布时间）
 * 输入：
 * - note：笔记卡片数据对象
 * - showAuthor：是否展示作者信息，默认 true
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function GridTextNoteCard({ note, showAuthor = true }: GridTextNoteCardProps) {
  const noteDetailPath = buildNoteDetailHref({
    uid: note.uid,
    title: note.title,
    contentType: note.contentType,
  })
  const typeBadgeLabel = resolveGridNoteTypeBadge('图文')
  const authorText = showAuthor ? resolveGridNoteAuthorText(note) : ''
  const authorFallback = showAuthor ? resolveGridNoteAuthorFallback(note.authorNickname) : ''

  return (
    <Link
      className="grid-note-card grid-note-card--link grid-text-note-card"
      to={noteDetailPath}
      target="_blank"
      rel="noopener noreferrer"
    >
      <GridNoteCardMenuButton />

      <div className="grid-note-card__cover grid-text-note-card__cover">
        <div className="grid-text-note-card__main">
          <span className="grid-text-note-card__type-badge">
            <MessageCircleMore size={12} aria-hidden="true" />
            {typeBadgeLabel}
          </span>
          <h3 className="grid-note-card__title grid-text-note-card__title">{note.title}</h3>
          {showAuthor ? (
            <GridNoteCardAuthor
              authorAvatar={note.authorAvatar}
              authorFallback={authorFallback}
              authorText={authorText}
            />
          ) : null}
          <p className="grid-text-note-card__summary">{note.summary}</p>
        </div>

        <div className="grid-text-note-card__thumb-slot">
          <div className="grid-text-note-card__thumb">
            <img className="grid-text-note-card__thumb-image" src={note.cover} alt="" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>

      <div className="grid-note-card__body grid-text-note-card__body">
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

export default memo(GridTextNoteCard)
