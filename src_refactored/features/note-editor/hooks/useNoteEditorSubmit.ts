// 01）笔记编辑提交 Hook（useNoteEditorSubmit）
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotesApiError } from '@entities/note/api/noteApi'
import type { NoteResourceUid } from '@shared/api/resourceUid'
import type { ContentLongtext } from '@entities/editor/lib/contentLongtext'
import { buildNoteLocalPreviewPath } from '@shared/lib/noteRoutes'
import {
  clearNoteDetailPreview,
  saveNoteDetailPreview,
} from '../lib/noteDetailPreviewSession'
import {
  clearNoteEditorFormSession,
  type NoteEditorRouteType,
  type NoteEditorSession,
} from '../lib/noteEditorFormSession'
import { executeNoteEditorLocalPreview } from '../lib/noteEditorLocalPreview'
import {
  executeNoteEditorSubmit,
  type NoteEditorSubmitCoverState,
  type NoteEditorSubmitVideoState,
} from '../lib/noteEditorSubmitOrchestrator'
import { validateNoteEditorPreSubmit } from '../lib/noteEditorValidation'
import type { NoteEditorFormDraft } from '../services/noteEditorService'
import type { UploadCoverBeforeSubmitInput } from '../lib/noteCoverUploadUtils'
import type { UploadVideoBeforeSubmitInput, UploadVideoBeforeSubmitResult } from '../lib/noteVideoUploadUtils'

// 02）提交上下文（NoteEditorSubmitContext）
export interface NoteEditorSubmitContext {
  draft: NoteEditorFormDraft
  bodyContent: ContentLongtext
  cover: NoteEditorSubmitCoverState
  video?: NoteEditorSubmitVideoState
  noteUid: NoteResourceUid | null
}

// 03）提交结果回调类型（NoteEditorSubmitResultCallback）
export type NoteEditorSubmitResultCallback = (
  result: 'success' | 'error',
  mode: 'saveDraft' | 'publish',
  errorMessage?: string,
) => void

// 04）Hook 参数（UseNoteEditorSubmitOptions）
export interface UseNoteEditorSubmitOptions {
  routeType: NoteEditorRouteType | null
  uploadCoverBeforeSubmit: (input: UploadCoverBeforeSubmitInput) => Promise<string | null>
  uploadVideoBeforeSubmit?: (
    input: UploadVideoBeforeSubmitInput,
  ) => Promise<UploadVideoBeforeSubmitResult | null>
  onNoteUidChange?: (noteUid: NoteResourceUid) => void
  onPersistSession?: (session: Pick<NoteEditorSession, 'draft' | 'noteUid' | 'keepForRestore'>) => void
  onAllowNavigation?: () => void
  onSubmitSuccess?: () => void
  /** 提交完成（成功/失败）时回调，用于弹出 InfoPromptModal */
  onSubmitResult?: NoteEditorSubmitResultCallback
}

// 05）Hook 返回值（UseNoteEditorSubmitResult）
export interface UseNoteEditorSubmitResult {
  isSubmitting: boolean
  /** @deprecated 提交错误现由 onSubmitResult 模态处理，提交中实时错误仍可用此字段 */
  submitError: string | null
  setSubmitError: (message: string | null) => void
  onSaveDraft: (context: NoteEditorSubmitContext) => Promise<boolean>
  onPreview: (context: NoteEditorSubmitContext) => Promise<boolean>
  onPublish: (context: NoteEditorSubmitContext) => Promise<boolean>
}

// 06）笔记 API 错误码中文映射（NOTE_EDITOR_ERROR_MESSAGES）
const NOTE_EDITOR_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: '未登录，请先登录后再操作',
  ACCESS_TOKEN_EXPIRED: '登录已过期，请重新登录后再试',
  VALIDATION_FAILED: '提交内容校验失败，请检查标题和内容',
  NOTE_NOT_FOUND: '笔记不存在或已被删除',
  NOTE_NOT_OWNER: '无权编辑该笔记',
}

/**
 * 函数名：resolveNoteEditorSubmitErrorMessage
 * 功能：将 API 错误或前端校验文案转为用户可读的中文提示。
 * 输入：
 * - rawError：原始错误文案或错误码
 * 输出：
 * - 返回值：中文展示文案
 */
function resolveNoteEditorSubmitErrorMessage(rawError: string): string {
  return NOTE_EDITOR_ERROR_MESSAGES[rawError] ?? rawError
}

/**
 * 函数名：useNoteEditorSubmit
 * 功能：封装笔记编辑保存草稿、预览与发布流程。
 * -- 保存/发布：executeNoteEditorSubmit 完成封面上传与 create/update
 * -- 成功：清空 session + 回调 onSubmitResult（弹出成功模态）
 * -- 失败：回调 onSubmitResult（弹出错误模态）
 * -- 预览：executeNoteEditorLocalPreview 本地构建载荷 → session → 阅读页（无 API）
 * 输入：
 * - options：路由类型、封面上传函数与成功/结果回调
 * 输出：
 * - 返回值：提交状态与 onSaveDraft / onPreview / onPublish
 * - 副作用：成功时清空 sessionStorage；预览写入 sessionStorage + navigate
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

  const runLocalPreview = useCallback(
    (context: NoteEditorSubmitContext): boolean => {
      setSubmitError(null)

      try {
        options.onPersistSession?.({
          draft: context.draft,
          noteUid: context.noteUid,
          keepForRestore: true,
        })

        const { payload } = executeNoteEditorLocalPreview(context)
        saveNoteDetailPreview(payload)
        options.onAllowNavigation?.()
        navigate(buildNoteLocalPreviewPath(), {
          state: { fromPublishEditor: true, payload },
        })
        return true
      } catch (error) {
        const message =
          error instanceof NotesApiError ? error.message : '预览失败，请稍后重试'
        setSubmitError(message)
        return false
      }
    },
    [navigate, options],
  )

  const runSubmit = useCallback(
    async (
      context: NoteEditorSubmitContext,
      mode: 'saveDraft' | 'publish',
    ): Promise<boolean> => {
      const preSubmitError = validateNoteEditorPreSubmit(
        context.draft,
        context.cover.activePreviewUrl,
        context.cover.selectedFile,
        context.cover.persistedCoverUrl,
      )
      if (preSubmitError) {
        options.onSubmitResult?.('error', mode, preSubmitError)
        return false
      }

      setSubmitError(null)
      setIsSubmitting(true)

      try {
        const publishAction = mode === 'publish' ? 'PUBLISH' : 'DRAFT'
        const result = await executeNoteEditorSubmit({
          draft: context.draft,
          cover: context.cover,
          video: context.video,
          noteUid: context.noteUid,
          publishAction,
          uploadCoverBeforeSubmit: options.uploadCoverBeforeSubmit,
          uploadVideoBeforeSubmit: options.uploadVideoBeforeSubmit,
        })

        persistAfterSubmit(result.submitDraft, result.noteUid)
        options.onSubmitSuccess?.()

        clearNoteEditorFormSession()
        clearNoteDetailPreview()

        options.onSubmitResult?.('success', mode)

        return true
      } catch (error) {
        const rawMessage =
          error instanceof NotesApiError ? error.message : '保存笔记失败，请稍后重试'
        const displayMessage = resolveNoteEditorSubmitErrorMessage(rawMessage)
        options.onSubmitResult?.('error', mode, displayMessage)
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [options, persistAfterSubmit],
  )

  const onSaveDraft = useCallback(
    (context: NoteEditorSubmitContext) => runSubmit(context, 'saveDraft'),
    [runSubmit],
  )

  const onPreview = useCallback(
    (context: NoteEditorSubmitContext) => Promise.resolve(runLocalPreview(context)),
    [runLocalPreview],
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
