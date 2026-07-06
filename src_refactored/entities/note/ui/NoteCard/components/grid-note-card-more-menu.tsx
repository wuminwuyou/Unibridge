// 01）网格笔记卡片 Footer 更多菜单（GridNoteCardMoreMenu）
import { MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import styles from './grid-note-card-more-menu.module.css'

// 02）更多菜单 Props（GridNoteCardMoreMenuProps）
export interface GridNoteCardMoreMenuProps {
  onNotInterestedInContent?: () => void
  onNotInterestedInAuthor?: () => void
}

// 03）阻止菜单交互触发卡片 Link 跳转（stopGridNoteCardMenuNavigation）
function stopGridNoteCardMenuNavigation(event: MouseEvent<HTMLElement>): void {
  event.preventDefault()
  event.stopPropagation()
}

// 04）网格笔记卡片 Footer 更多菜单组件（GridNoteCardMoreMenu）
/**
 * 函数名：GridNoteCardMoreMenu
 * 功能：在卡片 Footer 右侧展示纵向三点菜单，提供不感兴趣反馈入口。
 * 实现方法：
 * - 点击按钮展开/收起下拉项
 * - document mousedown 关闭面板；选项点击后关闭并阻止冒泡
 * 输入：
 * - onNotInterestedInContent：内容不感兴趣回调
 * - onNotInterestedInAuthor：作者不感兴趣回调
 * 输出：
 * - 返回值：React 节点
 * - 副作用：注册 document 级点击监听
 */
export function GridNoteCardMoreMenu({
  onNotInterestedInContent,
  onNotInterestedInAuthor,
}: GridNoteCardMoreMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (!(event.target instanceof Node) || rootRef.current?.contains(event.target)) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    stopGridNoteCardMenuNavigation(event)
    setOpen((previous) => !previous)
  }

  const handleContentNotInterested = (event: MouseEvent<HTMLButtonElement>) => {
    stopGridNoteCardMenuNavigation(event)
    setOpen(false)
    onNotInterestedInContent?.()
  }

  const handleAuthorNotInterested = (event: MouseEvent<HTMLButtonElement>) => {
    stopGridNoteCardMenuNavigation(event)
    setOpen(false)
    onNotInterestedInAuthor?.()
  }

  return (
    <div ref={rootRef} className={styles.gridNoteCardMoreMenu}>
      <button
        type="button"
        className={styles.gridNoteCardMoreMenuTrigger}
        aria-label="更多选项"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div className={styles.gridNoteCardMoreMenuDropdown} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.gridNoteCardMoreMenuItem}
            onClick={handleContentNotInterested}
          >
            内容不感兴趣
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.gridNoteCardMoreMenuItem}
            onClick={handleAuthorNotInterested}
          >
            作者不感兴趣
          </button>
        </div>
      ) : null}
    </div>
  )
}
