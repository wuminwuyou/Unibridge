import { CalendarClock } from 'lucide-react'
import type { ProfileNoteItem } from '../../pages/ProfileSpace/components/types'
import { buildNoteDetailHref } from '../../pages/NoteDetailPage/shared/noteDetailRouting'
import { Link } from 'react-router-dom'
import { memo } from 'react'

// 01）网格笔记卡片组件参数类型（GridNoteCardProps）
interface GridNoteCardProps {
  note: ProfileNoteItem
}

// 02）发布时间格式化函数（formatPublishTime）
/**
 * 函数名：formatPublishTime
 * 功能：将笔记发布时间转换为“年月日 时分”格式，供网格卡片底部统一展示。
 * 实现方法：
 * - 将时间字符串中的 T 转为空格，兼容日期时间输入
 * - 若仅包含日期，则补齐默认 00:00
 * - 截取前 16 位以保留“YYYY-MM-DD HH:mm”
 * 输入：
 * - publishTime：原始发布时间字符串
 * 输出：
 * - 返回值：string，格式化后的时间文本
 * - 副作用：无
 */
function formatPublishTime(publishTime: string): string {
  const normalizedTime = publishTime.replace('T', ' ').trim()

  if (normalizedTime.length <= 10) {
    return `${normalizedTime} 00:00`
  }

  return normalizedTime.slice(0, 16)
}

// 03）网格笔记卡片组件（GridNoteCard）
/**
 * 函数名：GridNoteCard
 * 功能：渲染笔记页五列网格专用紧凑卡片，突出封面、标题、标签与发布时间。
 * 实现方法：
 * - 顶部展示笔记封面图
 * - 标题最多显示两行并进行省略处理
 * - 标签区限制单行显示并缩小标签尺寸
 * - 底部仅显示发布时间（年月日时分）
 * 输入：
 * - note：笔记数据对象
 * 输出：
 * - 返回值：JSX.Element，网格笔记卡片节点
 * - 副作用：无
 */
function GridNoteCard({ note }: GridNoteCardProps) {
  const noteDetailPath = buildNoteDetailHref({
    id: note.id,
    title: note.title,
    contentType: note.contentType,
  })

  return (
    <Link
      className="profile-note-card-compact profile-note-card-compact--link"
      to={noteDetailPath}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img className="profile-note-card-compact__cover" src={note.cover} alt="" loading="lazy" decoding="async" />
      <h3 className="profile-note-card-compact__title">{note.title}</h3>
      <div className="profile-note-card-compact__tags">
        {note.tags.map((tag) => (
          <span key={`${note.title}-${tag}`}>{tag}</span>
        ))}
      </div>
      <div className="profile-note-card-compact__meta">
        <span>
          <CalendarClock size={13} />
          {formatPublishTime(note.publishTime)}
        </span>
      </div>
    </Link>
  )
}

export default memo(GridNoteCard)
