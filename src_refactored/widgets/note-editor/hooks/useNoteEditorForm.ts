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
  useNoteVideoUpload,
  type NoteEditorFormDraft,
  type NoteEditorSubmitContext,
} from '@features/note-editor'
import { useNoteCoverPicker } from '@features/note-editor-cover'
import { suggestedNoteTags } from '@features/note-editor'
import { mapNoteDetailToEditorDraft } from '../lib/mapNoteDetailToEditorDraft'
import { hasNoteEditorUserInput, resolveEditorVideoUrl, syncNoteEditorDraftBody } from '../lib/noteEditorFormUtils'
import { autoGenerateNoteCoverFile } from '@shared/lib/note-cover-generator'
import { captureVideoCoverFrameWithSource } from '@shared/lib/captureVideoCoverFrame'
import {
  NOTE_ARTICLE_COVER_ASPECT,
  NOTE_VIDEO_COVER_ASPECT,
  type CoverCropTransform,
} from '@shared/lib/cropCoverImage'
import { resolveNoteEditorRouteType } from '@shared/lib/noteRoutes'
import { retainBlobUrls } from '@shared/lib/retainedBlobRegistry'
import { useNoteEditorSubmitResultModal, type NoteEditorSubmitResultModalState } from './useNoteEditorSubmitResultModal'
import { useNoteEditorCoverRestore } from './useNoteEditorCoverRestore'
import { useNoteEditorFormActions } from './useNoteEditorFormActions'

export type NoteEditorSubmitPhase = 'idle' | 'uploading-cover' | 'uploading-video' | 'saving-note'
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
  const coverPickerRef = useRef<ReturnType<typeof useNoteCoverPicker> | null>(null)
  const coverExtractTaskRef = useRef<{ source: string; promise: Promise<boolean> } | null>(null)
  const prevVideoPreviewRef = useRef<string | null>(null)
  const videoSessionHydratedRef = useRef(false)

  const initialSessionVideoUrl = resolveEditorVideoUrl(
    initialSessionRef.current?.draft ?? { videoUrl: undefined },
    { sessionVideoPreviewUrl: initialSessionRef.current?.videoPreviewUrl },
  )

  // ---- 03）状态 ----
  const [savedRevision, setSavedRevision] = useState(0)
  const [revisionTick, setRevisionTick] = useState(0)
  const [formResetKey, setFormResetKey] = useState(0)
  const [coverGeneratePromptOpen, setCoverGeneratePromptOpen] = useState(false)
  const [coverGeneratePromptMessage, setCoverGeneratePromptMessage] = useState(
    '请先填写笔记标题，再生成封面。',
  )
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)
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

  // ---- 06）封面 / 视频 / 上传 / 选择器 ----
  const coverAspect = useMemo(
    () => (draft.contentType === '视频' ? NOTE_VIDEO_COVER_ASPECT : NOTE_ARTICLE_COVER_ASPECT),
    [draft.contentType],
  )

  const coverUpload = useNoteCoverUpload({ onError: (message) => { submitErrorSetterRef.current(message) } })
  const coverPicker = useNoteCoverPicker({
    coverUrl: persistedCoverUrl,
    initialSource: 'auto',
    coverAspect,
    preserveBlobOnUnmountRef: skipClearSessionRef,
  })
  coverSourceRef.current = coverPicker.source
  coverPickerRef.current = coverPicker

  const videoUpload = useNoteVideoUpload({
    initialVideoUrl: initialSessionVideoUrl ?? draft.videoUrl,
    initialVideoDuration: draft.videoDuration,
    preserveBlobOnUnmountRef: skipClearSessionRef,
    onVideoApplied: (videoUrl, videoDuration) => {
      setDraft((previous) => ({
        ...previous,
        videoUrl: videoUrl || undefined,
        videoDuration: videoDuration ?? previous.videoDuration,
      }))
      markEdited()
    },
    onCoverFromVideo: (coverUrl) => {
      setPersistedCoverUrl(coverUrl)
      setDraft((previous) => ({ ...previous, coverUrl }))
    },
    onError: (message) => {
      submitErrorSetterRef.current(message)
    },
  })

  // ---- 07）Session 持久化 ----
  const persistSessionSnapshot = useCallback(
    (override?: { draft?: NoteEditorFormDraft; noteUid?: NoteResourceUid | null }): void => {
      const baseDraft = override?.draft ?? syncNoteEditorDraftBody(draft, bodyContent)
      const resolvedVideoUrl = resolveEditorVideoUrl(baseDraft, {
        previewUrl: videoUpload.previewUrl,
        persistedVideoUrl: videoUpload.persistedVideoUrl,
        sessionVideoPreviewUrl: initialSessionRef.current?.videoPreviewUrl,
      })
      const nextDraft: NoteEditorFormDraft = resolvedVideoUrl
        ? { ...baseDraft, videoUrl: resolvedVideoUrl }
        : baseDraft

      saveNoteEditorFormSession({
        draft: nextDraft,
        noteUid: override?.noteUid ?? noteUid,
        routeType: routeType ?? undefined,
        keepForRestore: true,
        coverSource: coverSourceRef.current,
        videoPreviewUrl: resolvedVideoUrl ?? null,
        videoFileName: videoUpload.selectedFileName ?? initialSessionRef.current?.videoFileName ?? null,
      })
      retainBlobUrls([
        resolvedVideoUrl,
        coverPicker.activePreviewUrl,
      ])
    },
    [bodyContent, coverPicker.activePreviewUrl, draft, noteUid, routeType, videoUpload.persistedVideoUrl, videoUpload.previewUrl, videoUpload.selectedFileName],
  )

  // ---- 08）离开守卫 ----
  const hasUnsavedChanges = useMemo(() => {
    void revisionTick
    if (!hasNoteEditorUserInput(draft, bodyContent, coverPicker.hasLocalCover, videoUpload.hasLocalVideo)) return false
    return editRevisionRef.current > savedRevision
  }, [bodyContent, coverPicker.hasLocalCover, draft, revisionTick, savedRevision, videoUpload.hasLocalVideo])

  const leaveGuard = usePublishLeaveGuard({ hasUnsavedChanges, onConfirmLeave: clearNoteEditorFormSession })

  // ---- 09）提交结果模态 ----
  const resultModal = useNoteEditorSubmitResultModal()

  // ---- 10）提交编排 ----
  const submit = useNoteEditorSubmit({
    routeType,
    uploadCoverBeforeSubmit: coverUpload.uploadCoverBeforeSubmit,
    uploadVideoBeforeSubmit: videoUpload.uploadVideoBeforeSubmit,
    onNoteUidChange: setNoteUid,
    onPersistSession: ({ draft: nextDraft, noteUid: nextUid }) => {
      persistSessionSnapshot({ draft: nextDraft, noteUid: nextUid })
      if (nextDraft.coverUrl) setPersistedCoverUrl(nextDraft.coverUrl)
    },
    onAllowNavigation: () => {
      leaveGuard.allowNextNavigation()
      skipClearSessionRef.current = true
      retainBlobUrls([
        videoUpload.previewUrl,
        coverPicker.activePreviewUrl,
      ])
    },
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

  // ---- 11）表单操作 ----
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
  const applyVideoCoverFromFirstFrame = useCallback(
    async (videoSource: string, options?: { force?: boolean }): Promise<void> => {
      const trimmedSource = videoSource.trim()
      if (!trimmedSource) {
        return
      }

      const currentCoverPicker = coverPickerRef.current
      if (
        !options?.force
        && (persistedCoverUrl || currentCoverPicker?.hasLocalCover || currentCoverPicker?.activePreviewUrl)
      ) {
        return
      }

      const inFlightTask = coverExtractTaskRef.current
      if (inFlightTask?.source === trimmedSource) {
        setIsGeneratingCover(true)
        try {
          const succeeded = await inFlightTask.promise
          if (succeeded) {
            submitErrorSetterRef.current(null)
            return
          }
          if (options?.force) {
            const hasCover = Boolean(
              coverPickerRef.current?.activePreviewUrl || coverPickerRef.current?.hasLocalCover,
            )
            if (!hasCover) {
              submitErrorSetterRef.current('无法从视频提取封面，请尝试手动上传')
            }
          }
        } finally {
          setIsGeneratingCover(false)
        }
        return
      }

      const extractPromise = (async (): Promise<boolean> => {
        try {
          const { rawFile, coverFile } = await captureVideoCoverFrameWithSource(trimmedSource)
          if (coverExtractTaskRef.current?.source !== trimmedSource) {
            return false
          }
          const adjustSourceUrl = URL.createObjectURL(rawFile)
          coverPicker.handleSetAutoCoverFile(coverFile, { adjustSourceUrl })
          markEdited()
          return true
        } catch {
          return false
        }
      })()

      coverExtractTaskRef.current = { source: trimmedSource, promise: extractPromise }
      setIsGeneratingCover(true)

      try {
        const succeeded = await extractPromise
        if (succeeded) {
          submitErrorSetterRef.current(null)
          return
        }
        if (options?.force) {
          const hasCover = Boolean(
            coverPickerRef.current?.activePreviewUrl || coverPickerRef.current?.hasLocalCover,
          )
          if (!hasCover) {
            submitErrorSetterRef.current('无法从视频提取封面，请尝试手动上传')
          }
        }
      } finally {
        if (coverExtractTaskRef.current?.promise === extractPromise) {
          coverExtractTaskRef.current = null
        }
        setIsGeneratingCover(false)
      }
    },
    [coverPicker, markEdited, persistedCoverUrl],
  )

  // ---- 12）封面恢复（预览返回） ----
  const restoreAutoCoverFromSession = useCallback(async (): Promise<void> => {
    const session = initialSessionRef.current
    if (!session) {
      return
    }

    if (session.draft.contentType === '视频') {
      const videoUrl = session.draft.videoUrl?.trim()
      if (!videoUrl) {
        return
      }
      await applyVideoCoverFromFirstFrame(videoUrl, { force: true })
      return
    }

    const title = session.draft.title?.trim()
    if (!title) {
      return
    }
    coverPicker.handleSetAutoCoverFile(autoGenerateNoteCoverFile(title))
  }, [applyVideoCoverFromFirstFrame, coverPicker])

  useNoteEditorCoverRestore({
    coverSource: initialSessionRef.current?.coverSource,
    isEditMode: Boolean(editNoteUid),
    onRestoreAutoCover: restoreAutoCoverFromSession,
  })

  const handleGenerateAutoCover = useCallback((options?: { isLearningNote?: boolean }): void => {
    if (draft.contentType === '视频') {
      const videoSource = videoUpload.previewUrl ?? draft.videoUrl?.trim() ?? ''
      if (!videoSource) {
        setCoverGeneratePromptMessage('请先添加视频，再生成封面。')
        setCoverGeneratePromptOpen(true)
        return
      }
      void applyVideoCoverFromFirstFrame(videoSource, { force: true })
      return
    }

    if (!options?.isLearningNote && !draft.title.trim()) {
      setCoverGeneratePromptMessage('请先填写笔记标题，再生成封面。')
      setCoverGeneratePromptOpen(true)
      return
    }
    try {
      const coverFile = autoGenerateNoteCoverFile(draft.title)
      coverPicker.handleSetAutoCoverFile(coverFile)
      markEdited()
    } catch {
      submitErrorSetterRef.current('自动生成封面失败')
    }
  }, [applyVideoCoverFromFirstFrame, coverPicker, draft.contentType, draft.title, draft.videoUrl, markEdited, videoUpload.previewUrl])

  const handleUploadCoverFile = useCallback(async (file: File): Promise<void> => {
    await coverPicker.handleSelectFile(file)
    markEdited()
  }, [coverPicker, markEdited])

  const handleApplyAdjustedCover = useCallback((file: File, transform: CoverCropTransform): void => {
    coverPicker.handleApplyAdjustedCover(file, transform)
    markEdited()
  }, [coverPicker, markEdited])

  const handleClearVideo = useCallback((): void => {
    coverExtractTaskRef.current = null
    prevVideoPreviewRef.current = null
    videoUpload.clear()

    if (coverPicker.source === 'auto') {
      coverPicker.clearAuto()
      setPersistedCoverUrl(null)
      setDraft((previous) => ({ ...previous, coverUrl: '' }))
    }

    markEdited()
  }, [coverPicker, markEdited, videoUpload])

  const closeCoverGeneratePrompt = useCallback((): void => { setCoverGeneratePromptOpen(false) }, [])

  // ---- 14）提交上下文构建 ----
  const buildSubmitContext = useCallback((): NoteEditorSubmitContext => {
    const syncedDraft = syncNoteEditorDraftBody(draft, bodyContent)
    const resolvedVideoUrl = resolveEditorVideoUrl(syncedDraft, {
      previewUrl: videoUpload.previewUrl,
      persistedVideoUrl: videoUpload.persistedVideoUrl,
    })

    return {
      draft: resolvedVideoUrl ? { ...syncedDraft, videoUrl: resolvedVideoUrl } : syncedDraft,
      bodyContent,
      cover: {
        source: coverPicker.source,
        activePreviewUrl: coverPicker.activePreviewUrl,
        selectedFile: coverPicker.selectedFile,
        persistedCoverUrl,
      },
      video: {
        selectedFile: videoUpload.selectedFile,
        persistedVideoUrl: videoUpload.persistedVideoUrl,
      },
      noteUid,
    }
  }, [
    bodyContent,
    coverPicker,
    draft,
    noteUid,
    persistedCoverUrl,
    videoUpload.persistedVideoUrl,
    videoUpload.previewUrl,
    videoUpload.selectedFile,
  ])

  const onSaveDraft = useCallback((): void => { void submit.onSaveDraft(buildSubmitContext()) }, [buildSubmitContext, submit])
  const onPreview = useCallback((): void => { void submit.onPreview(buildSubmitContext()) }, [buildSubmitContext, submit])
  const onPublish = useCallback((): void => { void submit.onPublish(buildSubmitContext()) }, [buildSubmitContext, submit])

  const isSubmitting = submit.isSubmitting || coverUpload.isUploading || videoUpload.isUploading
  const submitPhase: NoteEditorSubmitPhase = videoUpload.isUploading
    ? 'uploading-video'
    : coverUpload.isUploading
      ? 'uploading-cover'
      : submit.isSubmitting
        ? 'saving-note'
        : 'idle'

  // ---- 15）Effects ----
  useEffect(() => { if (initialSessionRef.current && !editNoteUid) markSaved() }, [editNoteUid, markSaved])

  useEffect(() => {
    if (editNoteUid || videoSessionHydratedRef.current) {
      return
    }

    const session = initialSessionRef.current
    if (!session?.keepForRestore || session.draft.contentType !== '视频') {
      return
    }

    const videoUrl = resolveEditorVideoUrl(session.draft, {
      sessionVideoPreviewUrl: session.videoPreviewUrl,
    })
    if (!videoUrl) {
      return
    }

    videoSessionHydratedRef.current = true

    if (!draft.videoUrl?.trim()) {
      setDraft((previous) => ({
        ...previous,
        videoUrl,
        videoDuration: session.draft.videoDuration ?? previous.videoDuration,
      }))
    }

    if (!videoUpload.previewUrl?.trim()) {
      videoUpload.restorePreview(videoUrl, {
        fileName: session.videoFileName ?? null,
      })
    }
  }, [draft.contentType, draft.videoUrl, editNoteUid, videoUpload])

  useEffect(() => () => {
    if (skipClearSessionRef.current) return
    const session = loadNoteEditorFormSession()
    if (session?.keepForRestore) return
    clearNoteEditorFormSession()
  }, [])

  const applyRemoteVideoUrl = videoUpload.applyRemoteUrl

  useEffect(() => {
    if (draft.contentType !== '视频') {
      prevVideoPreviewRef.current = null
      return
    }

    const preview = videoUpload.previewUrl?.trim() ?? ''
    if (!preview || preview === prevVideoPreviewRef.current) {
      if (!preview) {
        prevVideoPreviewRef.current = null
      }
      return
    }

    prevVideoPreviewRef.current = preview
    void applyVideoCoverFromFirstFrame(preview, {
      force: coverPickerRef.current?.source === 'auto',
    })
  }, [applyVideoCoverFromFirstFrame, draft.contentType, videoUpload.previewUrl])

  useEffect(() => {
    if (!editPayload || editHydratedRef.current) return
    const mapped = mapNoteDetailToEditorDraft(editPayload)
    setDraft(mapped.draft)
    setBodyContent(mapped.bodyContent)
    setPersistedCoverUrl(mapped.draft.coverUrl || null)
    setNoteUid(editPayload.uid ?? editNoteUid)
    if (mapped.draft.contentType === '视频' && mapped.draft.videoUrl?.trim()) {
      applyRemoteVideoUrl(mapped.draft.videoUrl, mapped.draft.videoDuration)
    }
    editHydratedRef.current = true
    markSaved()
  }, [applyRemoteVideoUrl, editNoteUid, editPayload, markSaved])

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
    videoUpload,
    noteUid,
    isSubmitting,
    submitError: submit.submitError,
    submitPhase,
    leavePromptOpen: leaveGuard.leavePromptOpen,
    leavePromptMessage: leaveGuard.leavePromptMessage,
    coverGeneratePromptOpen,
    coverGeneratePromptMessage,
    closeCoverGeneratePrompt,
    isGeneratingCover,
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
    handleApplyAdjustedCover,
    coverAspect,
    handleClearVideo,
    onSaveDraft,
    onPreview,
    onPublish,
  }
}
