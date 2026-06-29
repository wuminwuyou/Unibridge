// 01）笔记 Tab 内容（NotesTabContent）
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import { ProfileNotesSection } from '../sections/ProfileNotesSection'
import type { ProfileTabLoadState } from '../../lib/profileTabLoadState'

// 02）笔记 Tab 内容 Props（NotesTabContentProps）
export interface NotesTabContentProps {
  title?: string
  notes: ProfileNoteItem[]
  total?: number | null
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
  emptyLabel?: string
}

// 03）笔记 Tab 内容（NotesTabContent）
/**
 * 函数名：NotesTabContent
 * 功能：渲染团队/机构空间「笔记」Tab 完整列表（三列网格，含可选加载态）。
 * 输入：
 * - title / notes / total / loadState / errorMessage / emptyLabel
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function NotesTabContent({
  title = '笔记',
  notes,
  total,
  loadState,
  errorMessage,
  emptyLabel = '暂无笔记内容',
}: NotesTabContentProps) {
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

  return (
    <ProfileNotesSection
      title={title}
      notes={notes}
      mode="full"
      total={total}
      emptyLabel={emptyLabel}
      layout="grid-three"
    />
  )
}
