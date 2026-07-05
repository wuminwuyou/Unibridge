// 01）发布状态标识（NotePublishStatusBadge）
import type { NoteDetailPublishStatus } from '../model/noteDetailCommon'
import { noteDetailPublishStatusLabelMap } from '../lib/noteDetailFormatUtils'

// 02）发布状态标识 Props
interface NotePublishStatusBadgeProps {
  status: NoteDetailPublishStatus
}

// 03）发布状态标识组件
/**
 * 函数名：NotePublishStatusBadge
 * 功能：根据 DRAFT / PREVIEW / PUBLISHED 渲染对应颜色的状态标签。
 * 输入：
 * - status：发布状态
 * 输出：
 * - 返回值：React 节点（PUBLISHED 时不渲染）
 */
export function NotePublishStatusBadge({ status }: NotePublishStatusBadgeProps) {
  if (status === 'PUBLISHED') {
    return null
  }

  const label = noteDetailPublishStatusLabelMap[status]

  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
        status === 'DRAFT'
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      }`}
    >
      {label}
    </span>
  )
}
