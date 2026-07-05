// 01）笔记编辑表单 Hook（useNoteEditorForm）
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
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
export type NoteEditorSubmitPhase = 'idle' | 'uploading-cover' | 'saving-note'

export type UseNoteEditorFormResult = ReturnType<typeof useNoteEditorForm>

/**
 * 函数名：useNoteEditorForm
 * 功能：编排笔记编辑页 UI 状态（query、draft、封面、session），并委托 Feature 提交 Hook。
 * 实现方法：
 * - 解析 type / uid；新建模式恢复 session，编辑模式 useNoteDetail 灌入
 * - useNoteCoverPicker + useNoteCoverUpload 桥接封面
 * - useNoteEditorSubmit 暴露 onSaveDraft / onPreview / onPublish
 * 输入：无
 * 输出：
 * - 返回值：表单 state、封面 handlers、提交 handlers
 * - 副作用：sessionStorage 读写；不直接调用 submitNote / navigate
 */
export function useNoteEditorForm() {
  const [searchParams] = useSearchParams()
  const routeType = resolveNoteEditorRouteType(searchParams.get('type'))
  const uidFromQuery = searchParams.get('uid')
  const editNoteUid = isNoteResourceUid(uidFromQuery) ? uidFromQuery : null

  const initialSessionRef = useRef(loadNoteEditorFormSession())
  const skipClearSessionRef = useRef(false)
  const editHydratedRef = useRef(false)
  const editRevisionRef = useRef(0)
  const [savedRevision, setSavedRevision] = useState(0)
  const [revisionTick, setRevisionTick] = useState(0)

  const initialContentType = routeType ? resolveNoteEditorContentType(routeType) : '图文'

  const [draft, setDraft] = useState<NoteEditorFormDraft>(() => {
    if (editNoteUid) {
      return createDefaultNoteEditorDraft(initialContentType)
    }
    if (initialSessionRef.current?.draft) {
      return initialSessionRef.current.draft
    }
    return createDefaultNoteEditorDraft(initialContentType)
  })

  const [bodyContent, setBodyContent] = useState<ContentLongtext>(() => {
    if (editNoteUid) {
      return createDefaultContentLongtext()
    }
    const sessionBody = initialSessionRef.current?.draft.bodyMarkdown
    if (sessionBody) {
      return createContentLongtext('MARKDOWN', sessionBody)
    }
    return createDefaultContentLongtext()
  })

  const [tagInput, setTagInput] = useState('')
  const [coverGeneratePromptOpen, setCoverGeneratePromptOpen] = useState(false)
  const [noteUid, setNoteUid] = useState<NoteResourceUid | null>(
    () => editNoteUid ?? initialSessionRef.current?.noteUid ?? null,
  )
  const [persistedCoverUrl, setPersistedCoverUrl] = useState<string | null>(
    () => draft.coverUrl || initialSessionRef.current?.draft.coverUrl || null,
  )

  const { loadState: editLoadState, errorMessage: editLoadError, payload: editPayload } =
    useNoteDetail(editNoteUid)

  const markEdited = useCallback((): void => {
    editRevisionRef.current += 1
    setRevisionTick((value) => value + 1)
  }, [])

  const markSaved = useCallback((): void => {
    setSavedRevision(editRevisionRef.current)
  }, [])

  const persistSessionSnapshot = useCallback(
    (override?: { draft?: NoteEditorFormDraft; noteUid?: NoteResourceUid | null }): void => {
      saveNoteEditorFormSession({
        draft: override?.draft ?? syncNoteEditorDraftBody(draft, bodyContent),
        noteUid: override?.noteUid ?? noteUid,
        routeType: routeType ?? undefined,
        keepForRestore: true,
      })
    },
    [bodyContent, draft, noteUid, routeType],
  )

  const displaySummary = useMemo(
    () =>
      resolvePublishNoteSummary(
        draft.summary,
        draft.contentType,
        bodyContent.longtext,
        draft.videoDescription,
      ),
    [bodyContent.longtext, draft.contentType, draft.summary, draft.videoDescription],
  )

  const submitErrorSetterRef = useRef<(message: string | null) => void>(() => {})

  const coverUpload = useNoteCoverUpload({
    onError: (message) => {
      submitErrorSetterRef.current(message)
    },
  })

  const coverPicker = useNoteCoverPicker({
    coverUrl: persistedCoverUrl,
    initialSource: 'auto',
  })

  const hasUnsavedChanges = useMemo(() => {
    void revisionTick
    if (!hasNoteEditorUserInput(draft, bodyContent, coverPicker.hasLocalCover)) {
      return false
    }
    return editRevisionRef.current > savedRevision
  }, [bodyContent, coverPicker.hasLocalCover, draft, revisionTick, savedRevision])

  const leaveGuard = usePublishLeaveGuard({
    hasUnsavedChanges,
    onConfirmLeave: clearNoteEditorFormSession,
  })

  const clearCoverAfterSubmitRef = useRef<() => void>(() => {})

  const submit = useNoteEditorSubmit({
    routeType,
    uploadCoverBeforeSubmit: coverUpload.uploadCoverBeforeSubmit,
    onNoteUidChange: setNoteUid,
    onPersistSession: ({ draft: nextDraft, noteUid: nextUid }) => {
      persistSessionSnapshot({ draft: nextDraft, noteUid: nextUid })
      if (nextDraft.coverUrl) {
        setPersistedCoverUrl(nextDraft.coverUrl)
      }
    },
    onAllowNavigation: () => {
      leaveGuard.allowNextNavigation()
      skipClearSessionRef.current = true
    },
    onSubmitSuccess: () => {
      markSaved()
      clearCoverAfterSubmitRef.current()
    },
  })

  submitErrorSetterRef.current = submit.setSubmitError
  clearCoverAfterSubmitRef.current = coverPicker.clearAfterSubmit

  useEffect(() => {
    if (initialSessionRef.current && !editNoteUid) {
      markSaved()
    }
  }, [editNoteUid, markSaved])

  useEffect(() => {
    return () => {
      if (skipClearSessionRef.current) {
        return
      }
      const session = loadNoteEditorFormSession()
      if (session?.keepForRestore) {
        return
      }
      clearNoteEditorFormSession()
    }
  }, [])

  useEffect(() => {
    if (!editPayload || editHydratedRef.current) {
      return
    }

    const mapped = mapNoteDetailToEditorDraft(editPayload)
    setDraft(mapped.draft)
    setBodyContent(mapped.bodyContent)
    setPersistedCoverUrl(mapped.draft.coverUrl || null)
    setNoteUid(editPayload.uid ?? editNoteUid)
    editHydratedRef.current = true
    markSaved()
  }, [editNoteUid, editPayload, markSaved])

  useEffect(() => {
    if (!routeType) {
      return
    }
    const contentType = resolveNoteEditorContentType(routeType)
    setDraft((previous) => {
      if (previous.contentType === contentType) {
        return previous
      }
      return {
        ...previous,
        contentType,
      }
    })
  }, [routeType])

  const completionPercent = useMemo<number>(() => {
    const hasContent =
      draft.contentType === '视频'
        ? Boolean(draft.videoUrl?.trim())
        : bodyContent.longtext.trim().length > 0

    const checkpoints = [
      draft.title.trim().length > 0,
      draft.contentType === '视频' || displaySummary.length > 0,
      hasContent,
      draft.tags.length > 0,
    ]
    const completedCount = checkpoints.filter(Boolean).length
    return Math.round((completedCount / checkpoints.length) * 100)
  }, [bodyContent.longtext, displaySummary, draft])

  const updateField = <K extends keyof NoteEditorFormDraft>(
    key: K,
    value: NoteEditorFormDraft[K],
  ): void => {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }))
    if (key === 'coverUrl' && typeof value === 'string') {
      setPersistedCoverUrl(value)
    }
    markEdited()
  }

  const handleBodyChange = (value: string): void => {
    const nextBodyContent = createContentLongtext(bodyContent.editorType, value)
    setBodyContent(nextBodyContent)
    setDraft((previous) => syncNoteEditorDraftBody(previous, nextBodyContent))
    markEdited()
  }

  const addTag = (tag: string): void => {
    const normalizedTag = tag.trim()
    if (!normalizedTag || draft.tags.includes(normalizedTag)) {
      return
    }

    setDraft((previous) => ({
      ...previous,
      tags: [...previous.tags, normalizedTag],
    }))
    setTagInput('')
    markEdited()
  }

  const removeTag = (tag: string): void => {
    setDraft((previous) => ({
      ...previous,
      tags: previous.tags.filter((item) => item !== tag),
    }))
    markEdited()
  }

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addTag(tagInput)
    }
  }

  const toggleSuggestedTag = (tag: string): void => {
    if (draft.tags.includes(tag)) {
      removeTag(tag)
      return
    }
    addTag(tag)
  }

  const handleGenerateAutoCover = (options?: { isLearningNote?: boolean }): void => {
    if (!options?.isLearningNote && !draft.title.trim()) {
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
  }

  const closeCoverGeneratePrompt = (): void => {
    setCoverGeneratePromptOpen(false)
  }

  const handleUploadCoverFile = (file: File): void => {
    coverPicker.handleSelectFile(file)
    markEdited()
  }

  const buildSubmitContext = useCallback((): NoteEditorSubmitContext => {
    return {
      draft: syncNoteEditorDraftBody(draft, bodyContent),
      bodyContent,
      cover: {
        source: coverPicker.source,
        activePreviewUrl: coverPicker.activePreviewUrl,
        selectedFile: coverPicker.selectedFile,
        persistedCoverUrl,
      },
      noteUid,
    }
  }, [bodyContent, coverPicker, draft, noteUid, persistedCoverUrl])

  const onSaveDraft = useCallback((): void => {
    void submit.onSaveDraft(buildSubmitContext())
  }, [buildSubmitContext, submit])

  const onPreview = useCallback((): void => {
    void submit.onPreview(buildSubmitContext())
  }, [buildSubmitContext, submit])

  const onPublish = useCallback((): void => {
    void submit.onPublish(buildSubmitContext())
  }, [buildSubmitContext, submit])

  const isSubmitting = submit.isSubmitting || coverUpload.isUploading

  const submitPhase: NoteEditorSubmitPhase = coverUpload.isUploading
    ? 'uploading-cover'
    : submit.isSubmitting
      ? 'saving-note'
      : 'idle'

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
    setTagInput,
    updateField,
    handleBodyChange,
    addTag,
    removeTag,
    handleTagInputKeyDown,
    toggleSuggestedTag,
    handleGenerateAutoCover,
    handleUploadCoverFile,
    onSaveDraft,
    onPreview,
    onPublish,
  }
}
