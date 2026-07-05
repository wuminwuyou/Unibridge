// 01）关联笔记紧凑卡片（ParentNoteCompactCard）
import { Eye, Star, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import { formatMetricCount } from '@shared/lib'
import { buildNoteDetailHref } from '../model/noteDetailRouting'
import type { ProfileNoteItem } from '../model/profileNoteItem'
import styles from './ParentNoteCompactCard.module.css'

// 02）关联笔记紧凑卡片 Props（ParentNoteCompactCardProps）
interface ParentNoteCompactCardProps {
  note: ProfileNoteItem
}

const MAX_VISIBLE_TAGS = 4
const STAT_ICON_SIZE = 12

// 03）关联笔记紧凑卡片组件（ParentNoteCompactCard）
/**
 * 函数名：ParentNoteCompactCard
 * 功能：图文阅读器侧栏专用关联笔记入口，压缩高度展示父笔记关键信息。
 * 实现方法：
 * - 无封面、无类型标签、无发布时间
 * - 展示标题、摘要、可选标签、浏览/评论/收藏（图标 + 数字）
 * - 整卡 Link 跳转父笔记详情
 * 输入：
 * - note：父笔记 ProfileNoteItem
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
function ParentNoteCompactCard({ note }: ParentNoteCompactCardProps) {
  const noteDetailPath = buildNoteDetailHref({
    uid: note.uid,
    title: note.title,
    contentType: note.contentType ?? '图文',
  })
  const summaryText = note.summary.trim()
  const visibleTags = note.tags.filter(Boolean).slice(0, MAX_VISIBLE_TAGS)

  return (
    <Link className={styles.compactCard} to={noteDetailPath} aria-label={`查看关联笔记：${note.title}`}>
      <h4 className={styles.compactCardTitle} title={note.title}>
        {note.title}
      </h4>
      {summaryText ? (
        <p className={styles.compactCardSummary} title={summaryText}>
          {summaryText}
        </p>
      ) : null}
      {visibleTags.length > 0 ? (
        <div className={styles.compactCardTags} aria-hidden="true">
          {visibleTags.map((tag) => (
            <span key={`${note.uid ?? note.title}-${tag}`} className={styles.compactCardTag}>
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className={styles.compactCardStats}>
        <span className={styles.compactCardStat}>
          <Eye size={STAT_ICON_SIZE} aria-hidden="true" />
          {formatMetricCount(note.views)}
        </span>
        <span className={styles.compactCardStat}>
          <ThumbsUp size={STAT_ICON_SIZE} aria-hidden="true" />
          {formatMetricCount(note.comments)}
        </span>
        <span className={styles.compactCardStat}>
          <Star size={STAT_ICON_SIZE} aria-hidden="true" />
          {formatMetricCount(note.favorites)}
        </span>
      </div>
    </Link>
  )
}

export default memo(ParentNoteCompactCard)
