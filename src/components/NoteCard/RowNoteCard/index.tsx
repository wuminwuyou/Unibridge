import { buildNoteDetailHref } from '../../../pages/NoteReader'
import type { ProfileNoteItem } from '../../../pages/ProfileSpace/components/types'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import {
  resolveNoteCardMetaText,
  resolveNoteCardTypeBadge,
} from './rowNoteCardUtils'
import './RowNoteCard.css'

// 01）行卡片笔记数据（RowNoteCardItem）
export type RowNoteCardItem = ProfileNoteItem

// 02）行卡片布局模式（RowNoteCardLayout）
type RowNoteCardLayout = 'horizontal' | 'vertical'

// 03）行卡片组件参数（RowNoteCardProps）
interface RowNoteCardProps {
  note: RowNoteCardItem
  layout?: RowNoteCardLayout
  /** 不渲染封面图，让右侧内容区填满整个卡片宽度（用于紧凑嵌入场景） */
  hideCover?: boolean
  /** 附加到最外层元素的 CSS 类名 */
  className?: string
}

// 04）行卡片笔记组件（RowNoteCard）
/**
 * 函数名：RowNoteCard
 * 功能：按 ProjectCard / design.md 思路渲染三段式笔记卡片（封面 / 主信息 / 交互区）。
 * 实现方法：
 * - 左侧 16:9 封面满高排列，无外边距
 * - 中部展示类型标签 / 标题 / 摘要 / # 标签 / 元信息
 * - 右侧展示浏览等指标徽标与「阅读笔记」主按钮
 * - 封面叠加 REVIEWING 灰色蒙版 + PERIVATE "仅自己" 标签
 * 输入：
 * - note：笔记卡片数据对象
 * - layout：horizontal 为默认横卡，vertical 为紧凑纵卡
 * - hideCover：不渲染封面，内容占满卡片
 * - className：附加 CSS 类（如 row-note-card--embedded 去卡片 chrome）
 * 输出：
 * - 返回值：JSX.Element
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
