// 01）网格笔记卡片菜单按钮（GridNoteCardMenuButton）
import { MoreHorizontal } from 'lucide-react'
import { type MouseEvent } from 'react'

// 02）阻止菜单按钮触发卡片跳转（stopGridNoteCardMenuNavigation）
function stopGridNoteCardMenuNavigation(event: MouseEvent<HTMLButtonElement>): void {
  event.preventDefault()
  event.stopPropagation()
}

// 03）网格笔记卡片菜单按钮组件（GridNoteCardMenuButton）
export function GridNoteCardMenuButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className ? `grid-note-card__menu ${className}` : 'grid-note-card__menu'}
      aria-label="更多操作"
      onClick={stopGridNoteCardMenuNavigation}
    >
      <MoreHorizontal size={16} aria-hidden="true" />
    </button>
  )
}
