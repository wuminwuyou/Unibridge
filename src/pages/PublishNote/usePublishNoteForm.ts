import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createContentLongtext,
  createContentLongtextFromEditorSave,
  createDefaultContentLongtext,
  type ContentLongtext,
} from '../../components/Reader'
import type { MarkdownContentChangeMeta, OnlineTextEditorResultState } from '../../components/OnlineEditor'
import type { OnlineTextEditorLocationState } from '../../components/OnlineEditor/types/route'
import { usePublishLeaveGuard } from '../../hooks/usePublishLeaveGuard'
import {
  createDefaultPublishNoteDraft,
  suggestedNoteTags,
  type PublishNoteContentType,
  type PublishNoteFormDraft,
} from './publishNotePageData'
import {
  clearPublishNoteSession,
  loadPublishNoteSession,
  savePublishNoteSession,
  type PublishNoteFormRestore,
  type PublishNoteSession,
} from './publishNoteFormSession'
import type { NoteResourceUid } from '../../api/resourceUid'
import { hasPublishNoteUserInput } from './publishNoteFormUtils'
import { navigateToNoteArticleDetail } from './navigateToNoteDetail'
import { clearNoteDetailPreview } from '../NoteDetailPage/shared/noteDetailPreviewSession'
import type { PublishNoteMediaPersist } from './publishNoteSubmit'
import { NotesApiError, submitPublishNote, type PublishNoteSubmitPhase } from './submitPublishNote'
import { usePublishNoteCover, type PublishNoteCoverModel } from './usePublishNoteCover'

export type { PublishNoteCoverModel }

// 01）视频上传状态（PublishNoteVideoUploadModel）
export interface PublishNoteVideoUploadModel {
  file: File | null
  previewUrl: string | null
  fileName: string
  fileSizeBytes: number
  videoDescription: string
  setVideoDescription: (value: string) => void
  handleSelectVideo: (file: File) => void
  handleRemoveVideo: () => void
}

// 02）同步正文 longtext 到 draft（syncDraftBody）
function syncDraftBody(draft: PublishNoteFormDraft, bodyContent: ContentLongtext): PublishNoteFormDraft {
  return {
    ...draft,
    body: bodyContent.longtext,
  }
}

// 03）解析发布笔记回传路由状态（parsePublishNoteReturnState）
function parsePublishNoteReturnState(state: unknown): OnlineTextEditorResultState | null {
  if (!state || typeof state !== 'object') {
    return null
  }
  const record = state as OnlineTextEditorResultState
  const hasEditorContent =
    typeof record.content === 'string' || typeof record.markdownResult === 'string'
  if (!hasEditorContent && !record.publishNoteRestore) {
    return null
  }
  return record
}

// 04）解析表单恢复快照（parsePublishNoteFormRestore）
function parsePublishNoteFormRestore(value: unknown): PublishNoteFormRestore | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const record = value as PublishNoteFormRestore
  if (!record.draft || typeof record.draft !== 'object') {
    return null
  }
  return record
}

// 05）提交成功后的跳转方式（SubmitNoteSuccessMode）
type SubmitNoteSuccessMode = 'detail' | 'preview'

// 06）发布笔记会话持久化覆盖项（PublishNoteSessionPersistOverride）
type PublishNoteSessionPersistOverride = Partial<Pick<PublishNoteSession, 'noteUid' | 'mediaPersist'>>

// 07）发布笔记表单 Hook（usePublishNoteForm）
/**
 * 函数名：usePublishNoteForm
 * 功能：管理发布笔记表单；预览前保存草稿；预览返回从 session 恢复；未保存离开拦截。
 */
export function usePublishNoteForm() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialSessionRef = useRef(loadPublishNoteSession())
  const skipClearSessionRef = useRef(false)
  const editRevisionRef = useRef(0)
  const [savedRevision, setSavedRevision] = useState(0)
  const [revisionTick, setRevisionTick] = useState(0)

  const [draft, setDraft] = useState<PublishNoteFormDraft>(
    () => initialSessionRef.current?.draft ?? createDefaultPublishNoteDraft(),
  )
  const [bodyMeta, setBodyMeta] = useState<MarkdownContentChangeMeta | null>(
    () => initialSessionRef.current?.bodyMeta ?? null,
  )
  const [bodyContent, setBodyContent] = useState<ContentLongtext>(
    () => initialSessionRef.current?.bodyContent ?? createDefaultContentLongtext(),
  )
  const [tagInput, setTagInput] = useState<string>('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [videoDescription, setVideoDescription] = useState<string>(
    () => initialSessionRef.current?.videoDescription ?? '',
  )
  const [noteUid, setNoteUid] = useState<NoteResourceUid | null>(() => initialSessionRef.current?.noteUid ?? null)
  const [mediaPersist, setMediaPersist] = useState<PublishNoteMediaPersist | null>(
    () => initialSessionRef.current?.mediaPersist ?? null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitPhase, setSubmitPhase] = useState<PublishNoteSubmitPhase>('idle')

  const cover = usePublishNoteCover({
    contentType: draft.contentType,
    summary: draft.summary,
    title: draft.title,
    videoPreviewUrl,
  })

  const markEdited = useCallback((): void => {
    editRevisionRef.current += 1
    setRevisionTick((value) => value + 1)
  }, [])

  const markSaved = useCallback((): void => {
    setSavedRevision(editRevisionRef.current)
  }, [])

  const persistSessionSnapshot = useCallback((override?: PublishNoteSessionPersistOverride): void => {
    savePublishNoteSession({
      draft: syncDraftBody(draft, bodyContent),
      bodyMeta,
      bodyContent,
      noteUid: override?.noteUid ?? noteUid,
      mediaPersist: override?.mediaPersist ?? mediaPersist,
      videoDescription,
      keepForRestore: true,
    })
  }, [bodyContent, bodyMeta, draft, mediaPersist, noteUid, videoDescription])

  const applyPublishNoteSession = useCallback((session: PublishNoteSession): void => {
    setDraft(session.draft)
    setBodyMeta(session.bodyMeta)
    setBodyContent(session.bodyContent)
    setNoteUid(session.noteUid ?? null)
    setMediaPersist(session.mediaPersist ?? null)
    setVideoDescription(session.videoDescription ?? '')
  }, [])

  const updateBodyContent = (nextBodyContent: ContentLongtext, meta: MarkdownContentChangeMeta | null): void => {
    setBodyContent(nextBodyContent)
    setBodyMeta(meta)
    setDraft((previous) => syncDraftBody(previous, nextBodyContent))
    markEdited()
  }

  useEffect(() => {
    if (initialSessionRef.current) {
      markSaved()
    }
  }, [markSaved])

  useEffect(() => {
    return () => {
      if (skipClearSessionRef.current) {
        return
      }
      const session = loadPublishNoteSession()
      if (session?.keepForRestore) {
        return
      }
      clearPublishNoteSession()
    }
  }, [])

  useEffect(() => {
    const returnState = parsePublishNoteReturnState(location.state)
    if (!returnState) {
      return
    }

    const restore = parsePublishNoteFormRestore(returnState.publishNoteRestore)
    if (restore) {
      applyPublishNoteSession({
        draft: restore.draft,
        bodyMeta: restore.bodyMeta,
        bodyContent: restore.bodyContent,
        noteUid: restore.noteUid,
        mediaPersist: restore.mediaPersist,
        videoDescription: restore.videoDescription ?? '',
      })
      markSaved()
    }

    if (typeof returnState.content === 'string' || typeof returnState.markdownResult === 'string') {
      const editorType = returnState.editorType ?? 'MARKDOWN'
      const content = returnState.content ?? returnState.markdownResult
      const nextBodyContent = createContentLongtextFromEditorSave(editorType, content)
      const nextMeta: MarkdownContentChangeMeta = { source: 'editor', fileName: null }

      setBodyContent(nextBodyContent)
      setBodyMeta(nextMeta)
      setDraft((previous) => syncDraftBody(previous, nextBodyContent))
      markEdited()
    }

    navigate(location.pathname, { replace: true, state: null })
  }, [applyPublishNoteSession, location.pathname, location.state, markEdited, navigate, videoDescription])

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl)
      }
    }
  }, [videoPreviewUrl])

  const hasUnsavedChanges = useMemo(() => {
    void revisionTick
    if (!hasPublishNoteUserInput(draft, bodyContent, videoFile, videoDescription)) {
      return false
    }
    return editRevisionRef.current > savedRevision
  }, [bodyContent, draft, revisionTick, savedRevision, videoDescription, videoFile])

  const leaveGuard = usePublishLeaveGuard({
    hasUnsavedChanges,
    onConfirmLeave: clearPublishNoteSession,
  })

  const completionPercent = useMemo<number>(() => {
    const hasContent =
      draft.contentType === '视频' ? videoFile !== null || Boolean(mediaPersist?.videoUrl) : bodyContent.longtext.trim().length > 0

    const checkpoints = [
      draft.title.trim().length > 0,
      draft.summary.trim().length > 0,
      hasContent,
      draft.tags.length > 0,
    ]
    const completedCount = checkpoints.filter(Boolean).length
    return Math.round((completedCount / checkpoints.length) * 100)
  }, [bodyContent.longtext, draft, mediaPersist?.videoUrl, videoFile])

  const updateField = <K extends keyof PublishNoteFormDraft>(key: K, value: PublishNoteFormDraft[K]): void => {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }))
    markEdited()
  }

  const handleBodyChange = (value: string, meta: MarkdownContentChangeMeta): void => {
    const nextBodyContent =
      meta.source === 'upload'
        ? createContentLongtext('MARKDOWN', value)
        : createContentLongtext(bodyContent.editorType, value)

    updateBodyContent(nextBodyContent, meta)
  }

  const buildEditorLocationState = (): Pick<OnlineTextEditorLocationState, 'publishNoteRestore'> => {
    leaveGuard.allowNextNavigation()
    skipClearSessionRef.current = true
    persistSessionSnapshot()
    return {
      publishNoteRestore: {
        draft: syncDraftBody(draft, bodyContent),
        bodyMeta,
        bodyContent,
        noteUid,
        mediaPersist,
        videoDescription,
      },
    }
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

  const clearVideoSelection = (): void => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl)
    }
    setVideoFile(null)
    setVideoPreviewUrl(null)
    setVideoDescription('')
    markEdited()
  }

  const handleSelectVideo = (file: File): void => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl)
    }
    setVideoFile(file)
    setVideoPreviewUrl(URL.createObjectURL(file))
    markEdited()
  }

  const handleRemoveVideo = (): void => {
    clearVideoSelection()
  }

  const resetPersistedNote = (): void => {
    setNoteUid(null)
    setMediaPersist(null)
    markEdited()
  }

  const setContentType = (contentType: PublishNoteContentType): void => {
    if (contentType === draft.contentType) {
      return
    }

    resetPersistedNote()

    if (contentType === '视频') {
      setDraft((previous) => ({
        ...previous,
        contentType,
        body: '',
      }))
      setBodyContent(createDefaultContentLongtext())
      setBodyMeta(null)
      cover.clearUploadCover()
      cover.setSource('auto')
      markEdited()
      return
    }

    clearVideoSelection()
    cover.clearUploadCover()
    cover.setSource('auto')
    updateField('contentType', contentType)
  }

  const setVideoDescriptionWithEdit = (value: string): void => {
    setVideoDescription(value)
    markEdited()
  }

  const videoUpload: PublishNoteVideoUploadModel = {
    file: videoFile,
    previewUrl: videoPreviewUrl,
    fileName: videoFile?.name ?? '',
    fileSizeBytes: videoFile?.size ?? 0,
    videoDescription,
    setVideoDescription: setVideoDescriptionWithEdit,
    handleSelectVideo,
    handleRemoveVideo,
  }

  const submitNote = async (
    publishAction: 'DRAFT' | 'PUBLISH',
    successMode: SubmitNoteSuccessMode = 'detail',
  ): Promise<boolean> => {
    setSubmitError(null)
    setIsSubmitting(true)
    setSubmitPhase('uploading-cover')

    try {
      const result = await submitPublishNote(
        {
          draft,
          bodyContent,
          cover,
          videoFile,
          noteUid,
          mediaPersist,
          publishAction,
        },
        setSubmitPhase,
      )

      setNoteUid(result.noteUid)
      setMediaPersist(result.mediaPersist)
      markSaved()

      if (successMode === 'preview') {
        skipClearSessionRef.current = true
        persistSessionSnapshot({
          noteUid: result.noteUid,
          mediaPersist: result.mediaPersist,
        })

        const previewCoverUrl = result.mediaPersist.coverUrl ?? cover.activePreviewUrl
        const previewVideoUrl = result.mediaPersist.videoUrl ?? videoPreviewUrl
        const previewDuration = result.mediaPersist.videoDuration ?? 0

        leaveGuard.allowNextNavigation()
        navigateToNoteArticleDetail(
          navigate,
          syncDraftBody(draft, bodyContent),
          bodyContent,
          previewCoverUrl,
          'PREVIEW',
          previewVideoUrl,
          previewDuration,
        )
        return true
      }

      clearNoteDetailPreview()
      skipClearSessionRef.current = true
      persistSessionSnapshot({
        noteUid: result.noteUid,
        mediaPersist: result.mediaPersist,
      })
      leaveGuard.allowNextNavigation()
      navigate(`/note-detail?uid=${encodeURIComponent(result.noteUid)}`)
      return true
    } catch (error) {
      const message =
        error instanceof NotesApiError ? error.message : '保存笔记失败，请稍后重试'
      setSubmitError(message)
      return false
    } finally {
      setIsSubmitting(false)
      setSubmitPhase('idle')
    }
  }

  const handleSaveDraft = (): void => {
    void submitNote('DRAFT', 'detail')
  }

  const handlePreview = (): void => {
    void submitNote('DRAFT', 'preview')
  }

  const handlePublish = (): void => {
    void submitNote('PUBLISH', 'detail')
  }

  return {
    draft,
    bodyMeta,
    bodyContent,
    tagInput,
    suggestedNoteTags,
    completionPercent,
    videoUpload,
    cover,
    noteUid,
    isSubmitting,
    submitError,
    submitPhase,
    leavePromptOpen: leaveGuard.leavePromptOpen,
    leavePromptMessage: leaveGuard.leavePromptMessage,
    confirmLeave: leaveGuard.confirmLeave,
    cancelLeave: leaveGuard.cancelLeave,
    setTagInput,
    updateField,
    handleBodyChange,
    buildEditorLocationState,
    addTag,
    removeTag,
    handleTagInputKeyDown,
    toggleSuggestedTag,
    setContentType,
    handleSaveDraft,
    handlePreview,
    handlePublish,
  }
}

export type PublishNoteFormModel = ReturnType<typeof usePublishNoteForm>
