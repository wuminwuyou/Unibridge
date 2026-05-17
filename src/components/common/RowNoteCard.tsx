import { CalendarClock, Eye, MessageCircleMore, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { memo } from 'react'

// 01）行卡片笔记数据类型定义（RowNoteCardItem）
export interface RowNoteCardItem {
  title: string
  summary: string
  tags: string[]
  publishTime: string
  updateTime: string
  views: number
  comments: number
  favorites: number
  cover: string
}

// 02）行卡片笔记布局类型定义（RowNoteCardLayout）
type RowNoteCardLayout = 'horizontal' | 'vertical'

// 03）行卡片笔记组件参数类型（RowNoteCardProps）
interface RowNoteCardProps {
  note: RowNoteCardItem
  layout?: RowNoteCardLayout
}

// 04）行卡片笔记组件（RowNoteCard）
/**
 * 函数名：RowNoteCard
 * 功能：渲染行式笔记卡片，保留原有信息层级与展示样式。
 * 实现方法：
 * - 根据 note 数据渲染封面、标题、摘要、标签与元信息
 * - 在横向布局显示完整时间与互动指标
 * - 在纵向布局压缩为紧凑统计行
 * 输入：
 * - note：笔记卡片数据对象
 * - layout：卡片布局方式，horizontal 为横向，vertical 为纵向
 * 输出：
 * - 返回值：JSX.Element，行式笔记卡片节点
 * - 副作用：无
 */
function RowNoteCard({ note, layout = 'horizontal' }: RowNoteCardProps) {
  const isVerticalLayout: boolean = layout === 'vertical'
  const noteDetailPath = `/note-detail?title=${encodeURIComponent(note.title)}`

  return (
    <Link
      className={`profile-note-card profile-note-card--link ${isVerticalLayout ? 'profile-note-card--vertical' : ''}`}
      to={noteDetailPath}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={note.cover} alt="" loading="lazy" decoding="async" />
      <div className="profile-note-card__body">
        <h3>{note.title}</h3>
        {!isVerticalLayout ? <p>{note.summary}</p> : null}
        <div className="profile-note-tags">
          {note.tags.map((tag) => (
            <span key={`${note.title}-${tag}`}>{tag}</span>
          ))}
        </div>
        {!isVerticalLayout ? (
          <div className="profile-note-meta">
            <span>
              <CalendarClock size={13} />
              {note.publishTime}
            </span>
            <span>
              <CalendarClock size={13} />
              {note.updateTime}
            </span>
            <span>
              <Eye size={13} />
              {note.views}
            </span>
            <span>
              <MessageCircleMore size={13} />
              {note.comments}
            </span>
            <span>
              <Star size={13} />
              {note.favorites}
            </span>
          </div>
        ) : (
          <div className="profile-note-meta profile-note-meta--compact">
            <span>
              <Eye size={13} />
              {note.views}
            </span>
            <span>
              <MessageCircleMore size={13} />
              {note.comments}
            </span>
            <span>
              <Star size={13} />
              {note.favorites}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default memo(RowNoteCard)
