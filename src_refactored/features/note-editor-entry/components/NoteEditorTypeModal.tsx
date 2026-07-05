// 01）笔记类型选择弹窗（NoteEditorTypeModal）
import { createPortal } from 'react-dom'
import { useEffect, type MouseEvent } from 'react'
import CloseIconButton from '@shared/ui/CloseIconButton'
import {
  noteEditorTypeOptions,
  type NoteEditorRouteType,
} from '../constants/noteEditorTypeOptions'
import styles from './NoteEditorTypeModal.module.css'

// 02）弹窗 Props（NoteEditorTypeModalProps）
export interface NoteEditorTypeModalProps {
  open: boolean
  onClose: () => void
  onSelect: (type: NoteEditorRouteType) => void
}

/**
 * 函数名：NoteEditorTypeModal
 * 功能：展示图文 / 视频两种笔记编辑类型的选择弹窗。
 * 实现方法：
 * - createPortal 挂载至 document.body
 * - 双卡片布局，点击卡片触发 onSelect
 * - 遮罩点击与 ESC 关闭弹窗
 * 输入：
 * - open：是否展示
 * - onClose：关闭回调
 * - onSelect：选定类型回调（article | video）
 * 输出：
 * - 返回值：Portal 节点或 null
 * - 副作用：锁定 body 滚动
 */
export function NoteEditorTypeModal({ open, onClose, onSelect }: NoteEditorTypeModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleEscKeyDown)
    }
  }, [open, onClose])

  const handleMaskClick = (): void => {
    onClose()
  }

  const handleContainerClick = (event: MouseEvent<HTMLElement>): void => {
    event.stopPropagation()
  }

  if (!open) {
    return null
  }

  return createPortal(
    <div
      className={styles.noteEditorTypeModalMask}
      role="presentation"
      onClick={handleMaskClick}
    >
      <section
        className={styles.noteEditorTypeModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-editor-type-modal-title"
        onClick={handleContainerClick}
      >
        <CloseIconButton
          className={styles.noteEditorTypeModalClose}
          onClick={onClose}
          ariaLabel="关闭笔记类型选择弹窗"
        />

        <header className={styles.noteEditorTypeModalHeader}>
          <h3 id="note-editor-type-modal-title">选择笔记类型</h3>
          <p>请选择你要创建的笔记形式，后续可在编辑页继续完善内容。</p>
        </header>

        <div className={styles.noteEditorTypeModalGrid}>
          {noteEditorTypeOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.type}
                type="button"
                className={styles.noteEditorTypeCard}
                onClick={() => onSelect(option.type)}
              >
                <span className={styles.noteEditorTypeCardIcon}>
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className={styles.noteEditorTypeCardLabel}>{option.label}</span>
                <span className={styles.noteEditorTypeCardDesc}>{option.description}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>,
    document.body,
  )
}
