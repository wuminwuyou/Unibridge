// 01）空间笔记列表（NotesList）— 名词类纯展示
import type { ReactNode } from 'react'
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { ProfileTabLoadState } from '@shared/types/loadState'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import { RowNoteCard, GridNoteCard } from '@entities/note'
import './NotesList.css'

// 02）笔记列表 Props（NotesListProps）
export interface NotesListProps {
  title: string
  notes: ProfileNoteItem[]
  mode: 'preview' | 'full'
  previewLimit?: number
  total?: number | null
  emptyLabel?: string
  layout?: 'grid-four' | 'row-list'
  showAuthor?: boolean
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
  onViewAll?: () => void
  headerAction?: ReactNode
}

// 03）空间笔记列表（NotesList）
/**
 * 函数名：NotesList
 * 功能：渲染个人 / 团队 / 机构空间的笔记预览或完整列表（含可选加载/错误态）。
 * 实现方法：
 * - grid-four：四列 GridNoteCard
 * - row-list：纵向 RowNoteCard
 * 输入：
 * - NotesListProps
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function NotesList({
  title,
  notes,
  mode,
  previewLimit = 3,
  total,
  emptyLabel = '暂无笔记内容',
  layout = 'grid-four',
  showAuthor = false,
  loadState,
  errorMessage,
  onViewAll,
  headerAction,
}: NotesListProps) {
  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载笔记数据…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载笔记列表失败，请稍后重试'}
      </p>
    )
  }

  const isPreview = mode === 'preview'
  const visibleNotes = isPreview ? notes.slice(0, previewLimit) : notes
  const noteTotal = total ?? notes.length
  const titleSuffix = !isPreview && noteTotal > 0 ? `（${noteTotal}）` : undefined
  const viewAllLabel = noteTotal > visibleNotes.length ? `查看全部（${noteTotal}）` : '查看全部'

  const resolvedHeaderAction =
    headerAction ??
    (isPreview && noteTotal > 0 && onViewAll ? (
      <button type="button" className="profile-tab-section__action" onClick={onViewAll}>
        {viewAllLabel}
      </button>
    ) : undefined)

  return (
    <ProfileTabSection
      title={title}
      titleSuffix={titleSuffix}
      headerAction={resolvedHeaderAction}
    >
      {visibleNotes.length > 0 ? (
        layout === 'row-list' ? (
          <div className="profile-space-note-list">
            {visibleNotes.map((note) => (
              <RowNoteCard key={note.uid ?? note.title} note={note} />
            ))}
          </div>
        ) : (
          <div className="profile-space-note-grid profile-space-note-grid--four-columns">
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
