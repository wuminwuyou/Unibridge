// 01）笔记类型弹窗 Hook（useNoteEditorTypeModal）
import { useCallback, useState } from 'react'
import type { NoteEditorRouteType } from '../constants/noteEditorTypeOptions'

// 02）Hook 参数（UseNoteEditorTypeModalOptions）
export interface UseNoteEditorTypeModalOptions {
  /** 用户选定类型后的回调（由上层注入 navigate 等逻辑） */
  onSelect?: (type: NoteEditorRouteType) => void
}

// 03）Hook 返回值（UseNoteEditorTypeModalResult）
export interface UseNoteEditorTypeModalResult {
  isOpen: boolean
  open: () => void
  close: () => void
  selectType: (type: NoteEditorRouteType) => void
}

/**
 * 函数名：useNoteEditorTypeModal
 * 功能：管理笔记编辑类型选择弹窗的开关与用户选类型流程。
 * 实现方法：
 * - 维护 isOpen 状态
 * - open / close 控制弹窗显隐
 * - selectType 触发 onSelect 回调后自动关闭弹窗
 * 输入：
 * - options.onSelect：选类型后的外部回调，可选
 * 输出：
 * - 返回值：弹窗状态与控制方法
 * - 副作用：无（路由跳转由调用方 onSelect 负责）
 */
export function useNoteEditorTypeModal(
  options?: UseNoteEditorTypeModalOptions,
): UseNoteEditorTypeModalResult {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const onSelect = options?.onSelect

  const selectType = useCallback(
    (type: NoteEditorRouteType) => {
      onSelect?.(type)
      setIsOpen(false)
    },
    [onSelect],
  )

  return { isOpen, open, close, selectType }
}
