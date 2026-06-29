// 01）行卡片笔记纯展示组件（RowNoteCard）
import { Link } from 'react-router-dom'
import { memo } from 'react'
import { buildNoteDetailHref } from '../model/noteDetailRouting'
import type { ProfileNoteItem } from '../model/profileNoteItem'
import {
  resolveNoteCardMetaText,
  resolveNoteCardTypeBadge,
} from './rowNoteCardUtils'
import './RowNoteCard.css'

// 02）行卡片笔记数据（RowNoteCardItem）
export type RowNoteCardItem = ProfileNoteItem

// 03）行卡片布局模式（RowNoteCardLayout）
type RowNoteCardLayout = 'horizontal' | 'vertical'

// 04）行卡片 Props（RowNoteCardProps）
interface RowNoteCardProps {
  note: RowNoteCardItem
  layout?: RowNoteCardLayout
  hideCover?: boolean
  className?: string
}

// 05）行卡片笔记组件（RowNoteCard）
/**
 * 函数名：RowNoteCard
 * 功能：渲染三段式笔记行卡片（封面 / 主信息 / 元信息）。
 * 实现方法：
 * - 左侧 16:9 封面满高展示，叠加 REVIEWING 蒙版与 PRIVATE 角标
 * - 中部依次展示类型标签、标题、摘要、# 标签
 * - 底部元信息以 · 分隔聚合发布时间与三大指标
 * 输入：
 * - note / layout / hideCover / className
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
function RowNoteCard({ note, layout = 'horizontal', hideCover = false, className }: RowNoteCardProps) {
  const isVerticalLayout = layout === 'vertical'
  const contentType = note.contentType ?? '图文'
  const noteDetailPath = buildNoteDetailHref({
    uid: note.uid,
    title: note.title,
    contentType,
  })
  const typeBadgeLabel = resolveNoteCardTypeBadge(contentType)
  const metaText = isVerticalLayout
    ? `${note.views} 浏览 · ${note.comments} 评论 · ${note.favorites} 收藏`
    : resolveNoteCardMetaText(note)

  const isReviewing = note.status === 'REVIEWING'
  const isPrivate = note.visibility === 'PRIVATE'

  return (
    <Link
      className={`row-note-card row-note-card--link ${isVerticalLayout ? 'row-note-card--vertical' : ''} ${hideCover ? 'row-note-card--no-cover' : ''} ${className ?? ''}`.trim()}
      to={noteDetailPath}
    >
      <div className="row-note-card__inner">
        {!hideCover ? (
          <div className="row-note-card__cover" aria-hidden="true">
            <img className="row-note-card__cover-image" src={note.cover} alt="" loading="lazy" decoding="async" />
            {isReviewing ? (
              <div className="row-note-card__cover-overlay row-note-card__cover-overlay--reviewing">
                <span className="row-note-card__cover-status-label">审核中</span>
              </div>
            ) : null}
            {!isReviewing && isPrivate ? (
              <div className="row-note-card__cover-sash">
                <span className="row-note-card__cover-sash-label">仅自己</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="row-note-card__content">
          <div className="row-note-card__main">
            <div className="row-note-card__main-top">
              <span className="row-note-card__type-badge">{typeBadgeLabel}</span>
              <h3 className="row-note-card__title">{note.title}</h3>
              {!isVerticalLayout ? <p className="row-note-card__summary">{note.summary}</p> : null}
            </div>

            <div className="row-note-card__main-bottom">
              {note.tags.length > 0 ? (
                <div className="row-note-card__tags">
                  {note.tags.map((tag) => (
                    <span key={`${note.title}-${tag}`} className="row-note-card__tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {metaText ? <p className="row-note-card__meta">{metaText}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default memo(RowNoteCard)
