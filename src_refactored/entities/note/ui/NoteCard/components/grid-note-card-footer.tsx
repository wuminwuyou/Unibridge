// 01）网格笔记卡片底部统计（GridNoteCardFooter）
import { Eye, Heart, ThumbsUp } from 'lucide-react'
import { formatMetricCount } from '@shared/lib'
import { resolveGridNoteRelativeTime } from '../lib/grid-note-card-utils'

// 02）网格笔记卡片底部组件（GridNoteCardFooter）
export function GridNoteCardFooter({
  views,
  comments,
  favorites,
  publishTime,
}: {
  views: number
  comments: number
  favorites: number
  publishTime: string
}) {
  return (
    <div className="grid-note-card__footer">
      <div className="grid-note-card__stats">
        <span className="grid-note-card__stat">
          <Eye size={14} aria-hidden="true" />
          {formatMetricCount(views)}
        </span>
        <span className="grid-note-card__stat">
          <Heart size={14} aria-hidden="true" />
          {formatMetricCount(favorites)}
        </span>
        <span className="grid-note-card__stat">
          <ThumbsUp size={14} aria-hidden="true" />
          {formatMetricCount(comments)}
        </span>
      </div>
      <span className="grid-note-card__time">{resolveGridNoteRelativeTime(publishTime)}</span>
    </div>
  )
}
