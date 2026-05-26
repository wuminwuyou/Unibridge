import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import type { ProfileNoteItem } from '../../components/types'
import { ProfileNotesSection } from '../../components/ProfileNotesSection'
import type { ProfileTabLoadState } from '../../components/profileTabLoadState'

// 01）笔记 Tab 内容 Props（NotesTabContentProps）
export interface NotesTabContentProps {
  title?: string
  notes: ProfileNoteItem[]
  total?: number | null
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
  emptyLabel?: string
}

// 02）笔记 Tab 内容（NotesTabContent）
/**
 * 函数名：NotesTabContent
 * 功能：渲染团队空间「笔记」Tab 完整列表（三列网格，含可选加载态）。
 * 输入：
 * - title：区块标题
 * - notes：笔记列表
 * - total：总数
 * - loadState / errorMessage：可选加载与错误态
 * - emptyLabel：空态文案
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
