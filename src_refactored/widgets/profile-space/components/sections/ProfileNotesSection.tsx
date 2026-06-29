// 01）空间笔记区块（ProfileNotesSection）
import GridNoteCard from '@entities/note/ui/GridNoteCard'
import RowNoteCard from '@entities/note/ui/RowNoteCard'
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import './ProfileNotesSection.css'

// 02）Props（ProfileNotesSectionProps）
export interface ProfileNotesSectionProps {
  title: string
  notes: ProfileNoteItem[]
  mode: 'preview' | 'full'
  previewLimit?: number
  total?: number | null
  emptyLabel?: string
  layout?: 'grid-three' | 'row-list'
  showAuthor?: boolean
  onViewAll?: () => void
}

// 03）空间笔记区块（ProfileNotesSection）
/**
 * 函数名：ProfileNotesSection
 * 功能：渲染个人 / 团队 / 机构空间的笔记预览或完整列表。
 * 实现方法：
 * - grid-three：三列网格 GridNoteCard
 * - row-list：纵向行卡片 RowNoteCard
 * 输入：
 * - title / notes / mode / previewLimit / total / emptyLabel / layout / showAuthor / onViewAll
 * 输出：
 * - 返回值：React 节点
 */
export function ProfileNotesSection({
  title, notes, mode, previewLimit = 3, total, emptyLabel = '暂无笔记内容',
  layout = 'grid-three', showAuthor = false, onViewAll,
}: ProfileNotesSectionProps) {
  const isPreview = mode === 'preview'
  const visibleNotes = isPreview ? notes.slice(0, previewLimit) : notes
  const noteTotal = total ?? notes.length
  const titleSuffix = !isPreview && noteTotal > 0 ? `（${noteTotal}）` : undefined
  const viewAllLabel = noteTotal > visibleNotes.length ? `查看全部（${noteTotal}）` : '查看全部'

  return (
    <ProfileTabSection
      title={title}
      titleSuffix={titleSuffix}
      headerAction={
        isPreview && noteTotal > 0 && onViewAll ? (
          <button type="button" className="profile-tab-section__action" onClick={onViewAll}>
            {viewAllLabel}
          </button>
        ) : undefined
      }
    >
      {visibleNotes.length > 0 ? (
        layout === 'row-list' ? (
          <div className="profile-space-note-list">
            {visibleNotes.map((note) => (
              <RowNoteCard key={note.uid ?? note.title} note={note} />
            ))}
          </div>
        ) : (
          <div className="profile-space-note-grid profile-space-note-grid--three-columns">
            {visibleNotes.map((note) => (
              <GridNoteCard key={note.uid ?? note.title} note={note} showAuthor={showAuthor} />
            ))}
          </div>
        )
      ) : (
        <p className="profile-tab-empty">{emptyLabel}</p>
      )}
    </ProfileTabSection>
  )
}
