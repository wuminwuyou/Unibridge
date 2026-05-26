import GridNoteCard from '../../../../components/NoteCard/GridNoteCard'
import RowNoteCard from '../../../../components/NoteCard/RowNoteCard'
import type { ProfileNoteItem } from '../types'
import { ProfileTabSection } from '../ProfileTabSection'
import './ProfileNotesSection.css'

// 01）空间笔记区块 Props（ProfileNotesSectionProps）
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

// 02）空间笔记区块（ProfileNotesSection）
/**
 * 函数名：ProfileNotesSection
 * 功能：渲染个人/团队空间的笔记预览或完整列表。
 * 输入：
 * - title：区块标题
 * - notes：笔记列表
 * - mode：preview | full
 * - previewLimit：预览条数上限
 * - total：总数
 * - emptyLabel：空态文案
 * - layout：grid-three 三列网格 | row-list 行卡片
 * - showAuthor：GridNoteCard 是否展示作者
 * - onViewAll：预览模式跳转回调
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function ProfileNotesSection({
  title,
  notes,
  mode,
  previewLimit = 3,
  total,
  emptyLabel = '暂无笔记内容',
  layout = 'grid-three',
  showAuthor = false,
  onViewAll,
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
