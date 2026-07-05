// 01）笔记编辑提交 Hook（useNoteEditorSubmit）
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotesApiError } from '@entities/note/api/noteApi'
import type { NoteResourceUid } from '@shared/api/resourceUid'
import type { ContentLongtext } from '@entities/editor/lib/contentLongtext'
import { buildNoteDetailPath } from '@shared/lib/noteRoutes'
import { buildNoteDetailFromEditorDraft } from '../lib/buildNoteDetailFromEditorDraft'
import {
  clearNoteDetailPreview,
  saveNoteDetailPreview,
} from '../lib/noteDetailPreviewSession'
import {
  clearNoteEditorFormSession,
  type NoteEditorRouteType,
  type NoteEditorSession,
} from '../lib/noteEditorFormSession'
import {
  executeNoteEditorSubmit,
  type NoteEditorSubmitCoverState,
} from '../lib/noteEditorSubmitOrchestrator'
import type { NoteEditorFormDraft } from '../services/noteEditorService'
import type { UploadCoverBeforeSubmitInput } from '../lib/noteCoverUploadUtils'

// 02）提交上下文（NoteEditorSubmitContext）
export interface NoteEditorSubmitContext {
  draft: NoteEditorFormDraft
  bodyContent: ContentLongtext
  cover: NoteEditorSubmitCoverState
  noteUid: NoteResourceUid | null
}

// 03）Hook 参数（UseNoteEditorSubmitOptions）
export interface UseNoteEditorSubmitOptions {
  routeType: NoteEditorRouteType | null
  uploadCoverBeforeSubmit: (input: UploadCoverBeforeSubmitInput) => Promise<string | null>
  onNoteUidChange?: (noteUid: NoteResourceUid) => void
  onPersistSession?: (session: Pick<NoteEditorSession, 'draft' | 'noteUid' | 'keepForRestore'>) => void
  onAllowNavigation?: () => void
  onSubmitSuccess?: () => void
}

// 04）Hook 返回值（UseNoteEditorSubmitResult）
export interface UseNoteEditorSubmitResult {
  isSubmitting: boolean
  submitError: string | null
  setSubmitError: (message: string | null) => void
  onSaveDraft: (context: NoteEditorSubmitContext) => Promise<boolean>
  onPreview: (context: NoteEditorSubmitContext) => Promise<boolean>
  onPublish: (context: NoteEditorSubmitContext) => Promise<boolean>
}

/**
 * 函数名：useNoteEditorSubmit
 * 功能：封装笔记编辑保存草稿、预览与发布流程（校验 → API → session → 路由跳转）。
 * 实现方法：
 * - executeNoteEditorSubmit 完成封面上传与 create/update
 * - 预览：DRAFT 保存 → buildNoteDetailFromEditorDraft → saveNoteDetailPreview → 阅读页
 * - 发布：PUBLISH 保存 → clearNoteEditorFormSession → 阅读页
 * 输入：
 * - options：路由类型、封面上传函数与成功回调
 * 输出：
 * - 返回值：提交状态与 onSaveDraft / onPreview / onPublish
 * - 副作用：API 请求、sessionStorage、navigate
 */
export function useNoteEditorSubmit(options: UseNoteEditorSubmitOptions): UseNoteEditorSubmitResult {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const persistAfterSubmit = useCallback(
    (submitDraft: NoteEditorFormDraft, noteUid: NoteResourceUid): void => {
      options.onNoteUidChange?.(noteUid)
      options.onPersistSession?.({
        draft: submitDraft,
        noteUid,
        keepForRestore: true,
      })
    },
    [options],
  )

  const runSubmit = useCallback(
    async (
      context: NoteEditorSubmitContext,
      mode: 'saveDraft' | 'preview' | 'publish',
    ): Promise<boolean> => {
      setSubmitError(null)
      setIsSubmitting(true)

      try {
        const publishAction = mode === 'publish' ? 'PUBLISH' : 'DRAFT'
        const result = await executeNoteEditorSubmit({
          draft: context.draft,
          cover: context.cover,
          noteUid: context.noteUid,
          publishAction,
          uploadCoverBeforeSubmit: options.uploadCoverBeforeSubmit,
        })

        persistAfterSubmit(result.submitDraft, result.noteUid)
        options.onSubmitSuccess?.()

        const detailPath = buildNoteDetailPath(result.noteUid)

        if (mode === 'preview') {
          if (result.submitDraft.contentType === '图文') {
            const previewPayload = buildNoteDetailFromEditorDraft(
              result.submitDraft,
              context.bodyContent,
              result.submitDraft.coverUrl,
              'PREVIEW',
            )
            saveNoteDetailPreview({
              ...previewPayload,
              uid: result.noteUid,
            })
          } else {
            clearNoteDetailPreview()
          }

          options.onAllowNavigation?.()
          navigate(`${detailPath}?preview=1`, {
            state: { fromPublishEditor: true },
          })
          return true
        }

        if (mode === 'publish') {
          clearNoteEditorFormSession()
          clearNoteDetailPreview()
          options.onAllowNavigation?.()
          navigate(detailPath)
          return true
        }

        clearNoteDetailPreview()
        options.onAllowNavigation?.()
        navigate(detailPath)
        return true
      } catch (error) {
        const message =
          error instanceof NotesApiError ? error.message : '保存笔记失败，请稍后重试'
        setSubmitError(message)
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [navigate, options, persistAfterSubmit],
  )

  const onSaveDraft = useCallback(
    (context: NoteEditorSubmitContext) => runSubmit(context, 'saveDraft'),
    [runSubmit],
  )

  const onPreview = useCallback(
    (context: NoteEditorSubmitContext) => runSubmit(context, 'preview'),
    [runSubmit],
  )

  const onPublish = useCallback(
    (context: NoteEditorSubmitContext) => runSubmit(context, 'publish'),
    [runSubmit],
  )

  return {
    isSubmitting,
    submitError,
    setSubmitError,
    onSaveDraft,
    onPreview,
    onPublish,
  }
}
