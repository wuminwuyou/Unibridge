import { buildNoteDetailHref } from '../../../pages/NoteDetailPage/shared/noteDetailRouting'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import {
  resolveNoteCardMetaText,
  resolveNoteCardTypeBadge,
} from './rowNoteCardUtils'
import './RowNoteCard.css'

// 01ï¼?è¡?å¡ç??ç¬?è®°æ?°æ®ç±»å??å®?ä¹?ï¼?RowNoteCardItemï¼?
export interface RowNoteCardItem {
  id?: number
  title: string
  summary: string
  contentType?: 'å?¾æ??' | 'è§?é¢?'
  tags: string[]
  publishTime: string
  updateTime: string
  views: number
  comments: number
  favorites: number
  cover: string
}

// 02ï¼?è¡?å¡ç??ç¬?è®°å¸?å±?ç±»å??å®?ä¹?ï¼?RowNoteCardLayoutï¼?
type RowNoteCardLayout = 'horizontal' | 'vertical'

// 03ï¼?è¡?å¡ç??ç¬?è®°ç»?ä»¶å?æ?°ç±»å??ï¼?RowNoteCardPropsï¼?
interface RowNoteCardProps {
  note: RowNoteCardItem
  layout?: RowNoteCardLayout
}

// 04ï¼?è¡?å¡ç??ç¬?è®°ç»?ä»¶ï¼?RowNoteCardï¼?
/**
 * å?½æ?°åï¼?RowNoteCard
 * å??è?½ï¼?æ?? ProjectCard / design.md æ?è·¯æ¸²æ??ä¸?æ®µå¼ç¬?è®°è¡?å¡ç??ï¼?å°é¢ / ä¸»ä¿¡æ¯ / äº¤äº?å?ºï¼?ã??
 * å®?ç?°æ?¹æ³?ï¼?
 * - å·¦ä¾§æ­£æ?¹å½¢å°é¢å±?ä½ï¼?é«?åº¦é?å¡ç?? inner æ??ä¼¸
 * - ä¸­é?¨ä¸?ä¸?å??å?ºå±?ç¤ºç±»å??/æ ?é¢?/æ??è¦ä¸? # æ ?ç­¾/å??ä¿¡æ¯
 * - å³ä¾§å±?ç¤ºæµè§?é?å¾½æ ?ä¸?ã??é??è¯»ç¬?è®°ã?ä¸»æ??é?®
 * è¾?å?¥ï¼?
 * - noteï¼?ç¬?è®°å¡ç??æ?°æ®å¯¹è±¡
 * - layoutï¼?horizontal ä¸ºé»?è®¤è¡?å¡ç??ï¼?vertical ä¸ºç´§å??çºµå?å¡ç??
 * è¾?å?ºï¼?
 * - è¿?å??å?¼ï¼?JSX.Element
 * - å?¯ä½?ç?¨ï¼?æ? 
 */
function RowNoteCard({ note, layout = 'horizontal' }: RowNoteCardProps) {
  const isVerticalLayout = layout === 'vertical'
  const contentType = note.contentType ?? 'å?¾æ??'
  const noteDetailPath = buildNoteDetailHref({
    uid: note.uid,
    title: note.title,
    contentType,
  })
  const typeBadgeLabel = resolveNoteCardTypeBadge(contentType)
  const metaText = isVerticalLayout
    ? `${note.views} æµè§? Â· ${note.comments} è¯?è®º Â· ${note.favorites} æ?¶è?`
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
            é??è¯»ç¬?è®°
          </span>
        </div>
      </div>
    </Link>
  )
}

export default memo(RowNoteCard)
