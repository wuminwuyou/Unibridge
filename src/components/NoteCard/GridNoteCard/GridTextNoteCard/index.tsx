import { buildNoteDetailHref } from '../../../../pages/NoteReader/shared/noteDetailRouting'
import { Eye, Heart, MessageCircleMore, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import {
  resolveGridNoteAuthorFallback,
  resolveGridNoteAuthorText,
  resolveGridNoteTypeBadge,
  formatGridNoteMetricCount,
  resolveGridNoteRelativeTime,
} from '../gridNoteCardUtils'
import {
  GridNoteCardMenuButton,
  type GridNoteCardNote,
} from '../gridNoteCardShared'
import '../gridNoteCardBase.css'

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
 * 功能：渲染左文右图网格笔记卡片；h-full 响应同行视频卡最高高度。
 * 实现方法：
 * - 左侧 60% 文字区 flex flex-col justify-between，上下两组向两端撑开
 * - 右侧 40% 封面区 h-full 填满，img object-cover 等比居中裁剪
 * - 顶部组：类型标签 / 标题 / 作者 / 摘要（space-y-1.5 紧凑排版）
 * - 底部组：标签行 / 社交指标 + 发布时间（space-y-2 堆叠）
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

      <div className="flex flex-row h-full w-full overflow-hidden">
        {/* 左侧：60% 文字区域 */}
        <div className="w-[60%] flex flex-col justify-between h-full p-4 min-w-0">
          {/* 顶部组：标题、作者、摘要 */}
          <div className="space-y-1.5 min-w-0">
            <span
              className="inline-flex items-center gap-1 self-start flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-relaxed whitespace-nowrap bg-[#eff6ff] text-[#3b82f6] dark:bg-[#1e3a8a] dark:text-[#60a5fa]"
            >
              <MessageCircleMore size={12} aria-hidden="true" />
              {typeBadgeLabel}
            </span>
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

          {/* 底部组：标签 + 社交指标 */}
          <div className="space-y-2 min-w-0 flex-shrink-0">
            {note.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1 overflow-hidden max-h-[3.0rem]">
                {note.tags.slice(0, 6).map((tag) => (
                  <span
                    key={`${note.title}-${tag}`}
                    className="inline-block rounded-md bg-[#f1f5f9] dark:bg-[#334155] px-2 py-0.5 text-[11px] leading-relaxed text-[#64748b] dark:text-[#94a3b8] whitespace-nowrap"
                  >
                    #{tag}
                  </span>
                ))}
                {note.tags.length > 6 ? (
                  <span className="inline-block text-[11px] leading-relaxed text-[#94a3b8] self-center">
                    +{note.tags.length - 6}
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="grid-note-card__footer">
              <div className="grid-note-card__stats">
                <span className="grid-note-card__stat">
                  <Eye size={14} aria-hidden="true" />
                  {formatGridNoteMetricCount(note.views)}
                </span>
                <span className="grid-note-card__stat">
                  <Heart size={14} aria-hidden="true" />
                  {formatGridNoteMetricCount(note.favorites)}
                </span>
                <span className="grid-note-card__stat">
                  <ThumbsUp size={14} aria-hidden="true" />
                  {formatGridNoteMetricCount(note.comments)}
                </span>
              </div>
              <span className="grid-note-card__time">
                {resolveGridNoteRelativeTime(note.publishTime)}
              </span>
            </div>
          </div>
        </div>

        {/* 右侧：40% 封面图 */}
        <div className="w-[40%] h-full flex-shrink-0">
          <img
            className="w-full h-full object-cover block"
            src={note.cover}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </Link>
  )
}

export default memo(GridTextNoteCard)
