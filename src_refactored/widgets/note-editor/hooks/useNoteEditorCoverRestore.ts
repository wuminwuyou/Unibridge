// 01）封面恢复 Hook（useNoteEditorCoverRestore）
import { useEffect, useRef } from 'react'

// 02）Hook 选项（UseNoteEditorCoverRestoreOptions）
export interface UseNoteEditorCoverRestoreOptions {
  /** session 中持久化的封面来源 */
  coverSource: 'auto' | 'upload' | null | undefined
  /** 是否为编辑模式（编辑模式不恢复封面） */
  isEditMode: boolean
  /** 预览返回后恢复 auto 封面的具体逻辑（由调用方按内容类型区分） */
  onRestoreAutoCover: () => void | Promise<void>
}

/**
 * 函数名：useNoteEditorCoverRestore
 * 功能：预览返回后，若 coverSource=auto 则触发一次封面恢复。
 * 实现方法：
 * - 编辑模式或已恢复过则跳过
 * - coverSource 非 auto 则跳过
 * - 调用 onRestoreAutoCover（图文走标题生成，视频走首帧提取）
 * 输入：
 * - options：封面来源、编辑模式标记、恢复回调
 * 输出：
 * - 副作用：调用 onRestoreAutoCover
 */
export function useNoteEditorCoverRestore(options: UseNoteEditorCoverRestoreOptions): void {
  const { coverSource, isEditMode, onRestoreAutoCover } = options
  const restoredRef = useRef(false)

  useEffect(() => {
    if (isEditMode || restoredRef.current) {
      return
    }
    if (coverSource !== 'auto') {
      return
    }

    restoredRef.current = true
    void Promise.resolve(onRestoreAutoCover()).catch(() => {
      restoredRef.current = false
    })
  }, [coverSource, isEditMode, onRestoreAutoCover])
}
