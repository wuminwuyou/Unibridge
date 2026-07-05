// 01）封面恢复 Hook（useNoteEditorCoverRestore）
import { useEffect, useRef } from 'react'
import { autoGenerateNoteCoverFile } from '@shared/lib/note-cover-generator'

// 02）Hook 选项（UseNoteEditorCoverRestoreOptions）
export interface UseNoteEditorCoverRestoreOptions {
  /** session 中持久化的封面来源 */
  coverSource: 'auto' | 'upload' | null | undefined
  /** session 中恢复的草稿 title（用于重新生成封面） */
  sessionDraftTitle: string | undefined
  /** 是否为编辑模式（编辑模式不恢复封面） */
  isEditMode: boolean
  /** 注入封面 File 到 picker */
  onRestoreAutoCoverFile: (file: File) => void
}

/**
 * 函数名：useNoteEditorCoverRestore
 * 功能：预览返回后，若 coverSource=auto 则基于原标题重新生成封面并注入 picker。
 * 输入：
 * - options：封面来源、草稿标题、编辑模式标记、注入回调
 * 输出：
 * - 副作用：调用 onRestoreAutoCoverFile
 */
export function useNoteEditorCoverRestore(options: UseNoteEditorCoverRestoreOptions): void {
  const { coverSource, sessionDraftTitle, isEditMode, onRestoreAutoCoverFile } = options
  const restoredRef = useRef(false)

  useEffect(() => {
    if (isEditMode || restoredRef.current) {
      return
    }
    if (coverSource !== 'auto') {
      return
    }
    const title = sessionDraftTitle?.trim()
    if (!title) {
      return
    }

    restoredRef.current = true
    const coverFile = autoGenerateNoteCoverFile(title)
    onRestoreAutoCoverFile(coverFile)
  }, [coverSource, isEditMode, onRestoreAutoCoverFile, sessionDraftTitle])
}
