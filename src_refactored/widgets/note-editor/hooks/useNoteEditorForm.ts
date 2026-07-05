// 01）笔记编辑表单 Hook（useNoteEditorForm）
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNoteDetail } from '@entities/note'
import {
  createDefaultContentLongtext,
  createContentLongtext,
  type ContentLongtext,
} from '@entities/editor/lib/contentLongtext'
import { usePublishLeaveGuard } from '@shared/hooks/usePublishLeaveGuard'
import { resolvePublishNoteSummary } from '@shared/lib/publishSummary'
import { isNoteResourceUid, type NoteResourceUid } from '@shared/api/resourceUid'
import {
  createDefaultNoteEditorDraft,
  loadNoteEditorFormSession,
  saveNoteEditorFormSession,
  clearNoteEditorFormSession,
  resolveNoteEditorContentType,
  useNoteCoverUpload,
  useNoteEditorSubmit,
  type NoteEditorFormDraft,
  type NoteEditorSubmitContext,
} from '@features/note-editor'
import { useNoteCoverPicker } from '@features/note-editor-cover'
import { suggestedNoteTags } from '@features/note-editor'
import { mapNoteDetailToEditorDraft } from '../lib/mapNoteDetailToEditorDraft'
import { hasNoteEditorUserInput, syncNoteEditorDraftBody } from '../lib/noteEditorFormUtils'
import { autoGenerateNoteCoverFile } from '@shared/lib/note-cover-generator'
import { resolveNoteEditorRouteType } from '@shared/lib/noteRoutes'
import { useNoteEditorSubmitResultModal, type NoteEditorSubmitResultModalState } from './useNoteEditorSubmitResultModal'
import { useNoteEditorCoverRestore } from './useNoteEditorCoverRestore'
import { useNoteEditorFormActions } from './useNoteEditorFormActions'

export type NoteEditorSubmitPhase = 'idle' | 'uploading-cover' | 'saving-note'
export type { NoteEditorSubmitResultModalState }
export type UseNoteEditorFormResult = ReturnType<typeof useNoteEditorForm>

/**
 * 函数名：useNoteEditorForm
 * 功能：编排笔记编辑页 UI 状态（query、draft、封面、session），委托子 Hook 实现模态、封面恢复与表单操作。
 * 输入：无
 * 输出：
 * - 返回值：表单 state、封面 handlers、提交 handlers
 * - 副作用：sessionStorage 读写；不直接调用 submitNote / navigate
 */
export function useNoteEditorForm() {
  // ---- 01）路由解析 ----
  const [searchParams] = useSearchParams()
  const routeType = resolveNoteEditorRouteType(searchParams.get('type'))
  const uidFromQuery = searchParams.get('uid')
  const editNoteUid = isNoteResourceUid(uidFromQuery) ? uidFromQuery : null

  // ---- 02）Refs ----
  const initialSessionRef = useRef(loadNoteEditorFormSession())
  const skipClearSessionRef = useRef(false)
  const editHydratedRef = useRef(false)
  const editRevisionRef = useRef(0)
  const submitErrorSetterRef = useRef<(message: string | null) => void>(() => {})
  const clearCoverAfterSubmitRef = useRef<() => void>(() => {})
  const coverSourceRef = useRef<'auto' | 'upload' | null>(null)

  // ---- 03）状态 ----
  const [savedRevision, setSavedRevision] = useState(0)
  const [revisionTick, setRevisionTick] = useState(0)
  const [formResetKey, setFormResetKey] = useState(0)
  const [coverGeneratePromptOpen, setCoverGeneratePromptOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [noteUid, setNoteUid] = useState<NoteResourceUid | null>(
    () => editNoteUid ?? initialSessionRef.current?.noteUid ?? null,
  )

  const initialContentType = routeType ? resolveNoteEditorContentType(routeType) : '图文'

  const [draft, setDraft] = useState<NoteEditorFormDraft>(() => {
    if (editNoteUid) return createDefaultNoteEditorDraft(initialContentType)
    if (initialSessionRef.current?.draft) return initialSessionRef.current.draft
    return createDefaultNoteEditorDraft(initialContentType)
  })

  const [bodyContent, setBodyContent] = useState<ContentLongtext>(() => {
    if (editNoteUid) return createDefaultContentLongtext()
    const sessionBody = initialSessionRef.current?.draft.bodyMarkdown
    if (sessionBody) return createContentLongtext('MARKDOWN', sessionBody)
    return createDefaultContentLongtext()
  })

  const [persistedCoverUrl, setPersistedCoverUrl] = useState<string | null>(
    () => draft.coverUrl || initialSessionRef.current?.draft.coverUrl || null,
  )

  // ---- 04）编辑模式 API  ----
  const { loadState: editLoadState, errorMessage: editLoadError, payload: editPayload } =
    useNoteDetail(editNoteUid)

  // ---- 05）派生状态 ----
  const markEdited = useCallback((): void => {
    editRevisionRef.current += 1
    setRevisionTick((value) => value + 1)
  }, [])

  const markSaved = useCallback((): void => {
    setSavedRevision(editRevisionRef.current)
  }, [])

  const displaySummary = useMemo(
    () => resolvePublishNoteSummary(draft.summary, draft.contentType, bodyContent.longtext, draft.videoDescription),
    [bodyContent.longtext, draft.contentType, draft.summary, draft.videoDescription],
  )

  const completionPercent = useMemo<number>(() => {
    const hasContent = draft.contentType === '视频' ? Boolean(draft.videoUrl?.trim()) : bodyContent.longtext.trim().length > 0
    const checkpoints = [draft.title.trim().length > 0, draft.contentType === '视频' || displaySummary.length > 0, hasContent, draft.tags.length > 0]
    const completedCount = checkpoints.filter(Boolean).length
    return Math.round((completedCount / checkpoints.length) * 100)
  }, [bodyContent.longtext, displaySummary, draft])

  // ---- 06）封面 / 上传 / 选择器 ----
  const coverUpload = useNoteCoverUpload({ onError: (message) => { submitErrorSetterRef.current(message) } })
  const coverPicker = useNoteCoverPicker({ coverUrl: persistedCoverUrl, initialSource: 'auto' })
  coverSourceRef.current = coverPicker.source

  // ---- 07）Session 持久化 ----
  const persistSessionSnapshot = useCallback(
    (override?: { draft?: NoteEditorFormDraft; noteUid?: NoteResourceUid | null }): void => {
      saveNoteEditorFormSession({
        draft: override?.draft ?? syncNoteEditorDraftBody(draft, bodyContent),
        noteUid: override?.noteUid ?? noteUid,
        routeType: routeType ?? undefined,
        keepForRestore: true,
        coverSource: coverSourceRef.current,
      })
    },
    [bodyContent, draft, noteUid, routeType],
  )

  // ---- 08）离开守卫 ----
  const hasUnsavedChanges = useMemo(() => {
    void revisionTick
    if (!hasNoteEditorUserInput(draft, bodyContent, coverPicker.hasLocalCover)) return false
    return editRevisionRef.current > savedRevision
  }, [bodyContent, coverPicker.hasLocalCover, draft, revisionTick, savedRevision])

  const leaveGuard = usePublishLeaveGuard({ hasUnsavedChanges, onConfirmLeave: clearNoteEditorFormSession })

  // ---- 09）提交结果模态 ----
  const resultModal = useNoteEditorSubmitResultModal()

  // ---- 10）提交编排 ----
  const submit = useNoteEditorSubmit({
    routeType,
    uploadCoverBeforeSubmit: coverUpload.uploadCoverBeforeSubmit,
    onNoteUidChange: setNoteUid,
    onPersistSession: ({ draft: nextDraft, noteUid: nextUid }) => {
      persistSessionSnapshot({ draft: nextDraft, noteUid: nextUid })
      if (nextDraft.coverUrl) setPersistedCoverUrl(nextDraft.coverUrl)
    },
    onAllowNavigation: () => { leaveGuard.allowNextNavigation(); skipClearSessionRef.current = true },
    onSubmitSuccess: () => { markSaved(); clearCoverAfterSubmitRef.current() },
    onSubmitResult: (result, mode, errorMessage) => {
      if (result === 'success') {
        coverPicker.clearAfterSubmit()
        setFormResetKey((key) => key + 1)
        resultModal.openSuccessModal(mode)
      } else {
        resultModal.openErrorModal(errorMessage ?? '未知错误')
      }
    },
  })

  submitErrorSetterRef.current = submit.setSubmitError
  clearCoverAfterSubmitRef.current = coverPicker.clearAfterSubmit

  // ---- 11）封面恢复（预览返回） ----
  useNoteEditorCoverRestore({
    coverSource: initialSessionRef.current?.coverSource,
    sessionDraftTitle: initialSessionRef.current?.draft.title,
    isEditMode: Boolean(editNoteUid),
    onRestoreAutoCoverFile: coverPicker.handleSetAutoCoverFile,
  })

  // ---- 12）表单操作 ----
  const formActions = useNoteEditorFormActions({
    draft,
    bodyContent,
    tagInput,
    onDraftChange: setDraft,
    onBodyContentChange: setBodyContent,
    onTagInputChange: setTagInput,
    onMarkEdited: markEdited,
    onPersistedCoverUrlChange: setPersistedCoverUrl,
  })

  // ---- 13）封面操作 ----
  const handleGenerateAutoCover = useCallback((options?: { isLearningNote?: boolean }): void => {
    if (!options?.isLearningNote && !draft.title.trim()) { setCoverGeneratePromptOpen(true); return }
    try {
      const coverFile = autoGenerateNoteCoverFile(draft.title)
      coverPicker.handleSetAutoCoverFile(coverFile)
      markEdited()
    } catch {
      submitErrorSetterRef.current('自动生成封面失败')
    }
  }, [coverPicker, draft.title, markEdited])

  const handleUploadCoverFile = useCallback((file: File): void => {
    coverPicker.handleSelectFile(file)
    markEdited()
  }, [coverPicker, markEdited])

  const closeCoverGeneratePrompt = useCallback((): void => { setCoverGeneratePromptOpen(false) }, [])

  // ---- 14）提交上下文构建 ----
  const buildSubmitContext = useCallback((): NoteEditorSubmitContext => ({
    draft: syncNoteEditorDraftBody(draft, bodyContent),
    bodyContent,
    cover: { source: coverPicker.source, activePreviewUrl: coverPicker.activePreviewUrl, selectedFile: coverPicker.selectedFile, persistedCoverUrl },
    noteUid,
  }), [bodyContent, coverPicker, draft, noteUid, persistedCoverUrl])

  const onSaveDraft = useCallback((): void => { void submit.onSaveDraft(buildSubmitContext()) }, [buildSubmitContext, submit])
  const onPreview = useCallback((): void => { void submit.onPreview(buildSubmitContext()) }, [buildSubmitContext, submit])
  const onPublish = useCallback((): void => { void submit.onPublish(buildSubmitContext()) }, [buildSubmitContext, submit])

  const isSubmitting = submit.isSubmitting || coverUpload.isUploading
  const submitPhase: NoteEditorSubmitPhase = coverUpload.isUploading ? 'uploading-cover' : submit.isSubmitting ? 'saving-note' : 'idle'

  // ---- 15）Effects ----
  useEffect(() => { if (initialSessionRef.current && !editNoteUid) markSaved() }, [editNoteUid, markSaved])

  useEffect(() => () => {
    if (skipClearSessionRef.current) return
    const session = loadNoteEditorFormSession()
    if (session?.keepForRestore) return
    clearNoteEditorFormSession()
  }, [])

  useEffect(() => {
    if (!editPayload || editHydratedRef.current) return
    const mapped = mapNoteDetailToEditorDraft(editPayload)
    setDraft(mapped.draft)
    setBodyContent(mapped.bodyContent)
    setPersistedCoverUrl(mapped.draft.coverUrl || null)
    setNoteUid(editPayload.uid ?? editNoteUid)
    editHydratedRef.current = true
    markSaved()
  }, [editNoteUid, editPayload, markSaved])

  useEffect(() => {
    if (!routeType) return
    const contentType = resolveNoteEditorContentType(routeType)
    setDraft((previous) => previous.contentType === contentType ? previous : { ...previous, contentType })
  }, [routeType])

  // ---- 16）返回 ----
  return {
    type: routeType,
    uid: noteUid,
    editLoadState,
    editLoadError,
    draft,
    bodyContent,
    displaySummary,
    tagInput,
    suggestedNoteTags,
    completionPercent,
    coverPicker,
    coverUpload,
    noteUid,
    isSubmitting,
    submitError: submit.submitError,
    submitPhase,
    leavePromptOpen: leaveGuard.leavePromptOpen,
    leavePromptMessage: leaveGuard.leavePromptMessage,
    coverGeneratePromptOpen,
    closeCoverGeneratePrompt,
    confirmLeave: leaveGuard.confirmLeave,
    cancelLeave: leaveGuard.cancelLeave,
    formResetKey,
    submitResultModal: resultModal.submitResultModal,
    closeSubmitResultModal: resultModal.closeSubmitResultModal,
    confirmSubmitResultModal: resultModal.confirmSubmitResultModal,
    setTagInput,
    updateField: formActions.updateField,
    handleBodyChange: formActions.handleBodyChange,
    addTag: formActions.addTag,
    removeTag: formActions.removeTag,
    handleTagInputKeyDown: formActions.handleTagInputKeyDown,
    toggleSuggestedTag: formActions.toggleSuggestedTag,
    handleGenerateAutoCover,
    handleUploadCoverFile,
    onSaveDraft,
    onPreview,
    onPublish,
  }
}
