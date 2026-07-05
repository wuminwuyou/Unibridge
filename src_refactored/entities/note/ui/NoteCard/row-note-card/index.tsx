// 01）行卡片笔记纯展示组件（RowNoteCard）
import { useNavigate } from 'react-router-dom'
import { memo, useCallback, type KeyboardEvent } from 'react'
import { resolveNoteDetailHref as buildNoteDetailHref } from '@shared/lib/noteRoutes'
import type { ProfileNoteItem } from '../../../model/profileNoteItem'
import { NoteCardTags } from '../components/note-card-tags'
import {
  resolveNoteCardAuthorName,
  resolveNoteCardMetaText,
  resolveNoteCardTypeBadge,
} from '../lib/row-note-card-utils'
import './row-note-card.css'

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
 * - 封面左上角叠加类型标签；REVIEWING 蒙版与 PRIVATE 角标互不遮挡
 * - 主信息区：标题 → 摘要 → 作者（纯展示）→ 标签 → 元信息
 * - 整卡点击跳转笔记详情
 * 输入：
 * - note / layout / hideCover / className
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
function RowNoteCard({
  note,
  layout = 'horizontal',
  hideCover = false,
  className,
}: RowNoteCardProps) {
  const navigate = useNavigate()
  const isVerticalLayout = layout === 'vertical'
  const contentType = note.contentType ?? '图文'
  const noteDetailPath = buildNoteDetailHref({
    uid: note.uid,
    title: note.title,
    contentType,
  })
  const typeBadgeLabel = resolveNoteCardTypeBadge(contentType)
  const authorName = resolveNoteCardAuthorName(note)
  const metaText = resolveNoteCardMetaText(note)

  const isReviewing = note.status === 'REVIEWING'
  const isPrivate = note.visibility === 'PRIVATE'

  const handleCardClick = useCallback(() => {
    navigate(noteDetailPath)
  }, [navigate, noteDetailPath])

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        navigate(noteDetailPath)
      }
    },
    [navigate, noteDetailPath],
  )

  return (
    <div
      className={`row-note-card row-note-card--interactive ${isVerticalLayout ? 'row-note-card--vertical' : ''} ${hideCover ? 'row-note-card--no-cover' : ''} ${className ?? ''}`.trim()}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`阅读笔记：${note.title}`}
    >
      <div className="row-note-card__inner">
        {!hideCover ? (
          <div className="row-note-card__cover" aria-hidden="true">
            <img className="row-note-card__cover-image" src={note.cover} alt="" loading="lazy" decoding="async" />
            <span className="row-note-card__cover-type-badge">{typeBadgeLabel}</span>
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
              {hideCover ? (
                <span className="row-note-card__type-badge">{typeBadgeLabel}</span>
              ) : null}
              <h3 className="row-note-card__title">{note.title}</h3>
              {!isVerticalLayout ? <p className="row-note-card__summary">{note.summary}</p> : null}
            </div>

            <div className="row-note-card__author-row">
              <span className="row-note-card__author">{authorName}</span>
            </div>

            <div className="row-note-card__main-bottom">
              <NoteCardTags tags={note.tags} itemKey={note.uid ?? note.title} />

              {metaText ? <p className="row-note-card__meta">{metaText}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(RowNoteCard)
