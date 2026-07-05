// 01）提交结果模态 Hook（useNoteEditorSubmitResultModal）
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// 02）提交结果模态状态（NoteEditorSubmitResultModalState）
export interface NoteEditorSubmitResultModalState {
  open: boolean
  title: string
  message: string
  /** 成功时 confirm 导航到首页 */
  isSuccess: boolean
}

// 03）Hook 返回值（UseNoteEditorSubmitResultModalResult）
export interface UseNoteEditorSubmitResultModalResult {
  submitResultModal: NoteEditorSubmitResultModalState
  openSuccessModal: (mode: 'saveDraft' | 'publish') => void
  openErrorModal: (errorMessage: string) => void
  closeSubmitResultModal: () => void
  confirmSubmitResultModal: () => void
}

/**
 * 函数名：useNoteEditorSubmitResultModal
 * 功能：管理提交结果 InfoPromptModal 的打开/关闭状态。
 * 输入：无
 * 输出：
 * - 返回值：模态 state 与 openSuccess / openError / close / confirm
 * - 副作用：可能 navigate('/')
 */
export function useNoteEditorSubmitResultModal(): UseNoteEditorSubmitResultModalResult {
  const navigate = useNavigate()

  const [submitResultModal, setSubmitResultModal] = useState<NoteEditorSubmitResultModalState>({
    open: false,
    title: '',
    message: '',
    isSuccess: false,
  })

  const closeSubmitResultModal = useCallback((): void => {
    setSubmitResultModal((previous) => ({ ...previous, open: false }))
  }, [])

  const confirmSubmitResultModal = useCallback((): void => {
    setSubmitResultModal((previous) => {
      if (previous.isSuccess) {
        navigate('/')
      }
      return { ...previous, open: false }
    })
  }, [navigate])

  const openSuccessModal = useCallback((mode: 'saveDraft' | 'publish'): void => {
    setSubmitResultModal({
      open: true,
      title: mode === 'publish' ? '发布成功' : '保存成功',
      message: mode === 'publish' ? '笔记已成功发布！' : '笔记草稿已保存成功！',
      isSuccess: true,
    })
  }, [])

  const openErrorModal = useCallback((errorMessage: string): void => {
    setSubmitResultModal({
      open: true,
      title: '出错啦！',
      message: `出现错误：${errorMessage}`,
      isSuccess: false,
    })
  }, [])

  return {
    submitResultModal,
    openSuccessModal,
    openErrorModal,
    closeSubmitResultModal,
    confirmSubmitResultModal,
  }
}
