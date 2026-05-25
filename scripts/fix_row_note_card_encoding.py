# 01）修复 RowNoteCard 中文编码（fix_row_note_card_encoding）
"""
函数名：fix_row_note_card_encoding
功能：将 RowNoteCard/index.tsx 以 UTF-8 重写，修复乱码中文注释与字符串字面量。
"""

from pathlib import Path

TARGET = Path(__file__).resolve().parents[1] / "src/components/NoteCard/RowNoteCard/index.tsx"

CONTENT = '''import { buildNoteDetailHref } from '../../../pages/NoteReader/shared/noteDetailRouting'
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
}

// 04）行卡片笔记组件（RowNoteCard）
/**
 * 函数名：RowNoteCard
 * 功能：按 ProjectCard / design.md 思路渲染三段式笔记卡片（封面 / 主信息 / 交互区）。
 * 实现方法：
 * - 左侧正方形封面展位，高度随卡片 inner 拉伸
 * - 中部展示类型标签 / 标题 / 摘要 / # 标签 / 元信息
 * - 右侧展示浏览等指标徽标与「阅读笔记」主按钮
 * 输入：
 * - note：笔记卡片数据对象
 * - layout：horizontal 为默认横卡，vertical 为紧凑纵卡
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无
 */
function RowNoteCard({ note, layout = 'horizontal' }: RowNoteCardProps) {
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

  return (
    <Link
      className={`row-note-card row-note-card--link ${isVerticalLayout ? 'row-note-card--vertical' : ''}`}
      to={noteDetailPath}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="row-note-card__inner">
        <div className="row-note-card__cover" aria-hidden="true">
          <img className="row-note-card__cover-image" src={note.cover} alt="" loading="lazy" decoding="async" />
        </div>

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

        <div className="row-note-card__aside">
          <span className="row-note-card__cta" aria-hidden="true">
            阅读笔记
          </span>
        </div>
      </div>
    </Link>
  )
}

export default memo(RowNoteCard)
'''


def main() -> None:
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(CONTENT, encoding="utf-8", newline="\n")
    print(f"Fixed UTF-8 content written to: {TARGET}")


if __name__ == "__main__":
    main()
