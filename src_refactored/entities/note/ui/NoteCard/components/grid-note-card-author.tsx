// 01）网格笔记卡片作者行（GridNoteCardAuthor）
export function GridNoteCardAuthor({
  authorAvatar,
  authorFallback,
  authorText,
}: {
  authorAvatar?: string
  authorFallback: string
  authorText: string
}) {
  return (
    <div className="grid-note-card__author">
      {authorAvatar ? (
        <img className="grid-note-card__author-avatar" src={authorAvatar} alt="" loading="lazy" />
      ) : (
        <span className="grid-note-card__author-avatar">{authorFallback}</span>
      )}
      <span className="grid-note-card__author-text">{authorText}</span>
    </div>
  )
}
