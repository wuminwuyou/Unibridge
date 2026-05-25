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
import { clearProjectDetailPreview } from '../ProjectDetailPage/projectDetailPreviewSession'
import { navigateToProjectDetail } from './navigateToProjectDetail'
import { ProjectsApiError, submitPublishProject } from './submitPublishProject'
import {
  createDefaultPublishProjectDraft,
  suggestedSkillTags,
  type CampusRecruitType,
  type PublishProjectFormDraft,
} from './publishProjectPageData'
import {
  clearPublishProjectSession,
  loadPublishProjectSession,
  savePublishProjectSession,
  type PublishProjectFormRestore,
  type PublishProjectSession,
} from './publishFormSession'
import type { ProjectResourceUid } from '../../api/resourceUid'
import { hasPublishProjectUserInput } from './publishProjectFormUtils'
import { resolvePublishSummary } from '../../utils/publishSummary'

// 01）同步需求说明 longtext 到 draft（syncDraftDescription）
function syncDraftDescription(draft: PublishProjectFormDraft, descriptionContent: ContentLongtext): PublishProjectFormDraft {
  return {
    ...draft,
    description: descriptionContent.longtext,
  }
}

// 02）解析发布项目回传路由状态（parsePublishProjectReturnState）
function parsePublishProjectReturnState(state: unknown): OnlineTextEditorResultState | null {
  if (!state || typeof state !== 'object') {
    return null
  }
  const record = state as OnlineTextEditorResultState
  const hasEditorContent =
    typeof record.content === 'string' || typeof record.markdownResult === 'string'
  if (!hasEditorContent && !record.publishProjectRestore) {
    return null
  }
  return record
}

// 03）解析表单恢复快照（parsePublishProjectFormRestore）
function parsePublishProjectFormRestore(value: unknown): PublishProjectFormRestore | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const record = value as PublishProjectFormRestore
  if (!record.draft || typeof record.draft !== 'object') {
    return null
  }
  return record
}

// 04）提交成功后的跳转方式（SubmitProjectSuccessMode）
type SubmitProjectSuccessMode = 'detail' | 'preview'

// 05）发布项目会话持久化覆盖项（PublishProjectSessionPersistOverride）
type PublishProjectSessionPersistOverride = Partial<Pick<PublishProjectSession, 'projectUid'>>

// 06）发布项目表单 Hook（usePublishProjectForm）
/**
 * 函数名：usePublishProjectForm
 * 功能：管理发布项目表单；预览前保存草稿；预览返回从 session 恢复；未保存离开拦截。
 */
export function usePublishProjectForm() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialSessionRef = useRef(loadPublishProjectSession())
  const skipClearSessionRef = useRef(false)
  const editRevisionRef = useRef(0)
  const [savedRevision, setSavedRevision] = useState(0)
  const [revisionTick, setRevisionTick] = useState(0)

  const [draft, setDraft] = useState<PublishProjectFormDraft>(
    () => initialSessionRef.current?.draft ?? createDefaultPublishProjectDraft(),
  )
  const [descriptionMeta, setDescriptionMeta] = useState<MarkdownContentChangeMeta | null>(
    () => initialSessionRef.current?.descriptionMeta ?? null,
  )
  const [descriptionContent, setDescriptionContent] = useState<ContentLongtext>(
    () => initialSessionRef.current?.descriptionContent ?? createDefaultContentLongtext(),
  )
  const [tagInput, setTagInput] = useState<string>('')
  const [projectUid, setProjectUid] = useState<ProjectResourceUid | null>(
    () => initialSessionRef.current?.projectUid ?? null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const markEdited = useCallback((): void => {
    editRevisionRef.current += 1
    setRevisionTick((value) => value + 1)
  }, [])

  const markSaved = useCallback((): void => {
    setSavedRevision(editRevisionRef.current)
  }, [])

  const persistSessionSnapshot = useCallback((override?: PublishProjectSessionPersistOverride): void => {
    savePublishProjectSession({
      draft: syncDraftDescription(draft, descriptionContent),
      descriptionMeta,
      descriptionContent,
      projectUid: override?.projectUid ?? projectUid,
      keepForRestore: true,
    })
  }, [descriptionContent, descriptionMeta, draft, projectUid])

  const applyPublishProjectSession = useCallback((session: PublishProjectSession): void => {
    setDraft(session.draft)
    setDescriptionMeta(session.descriptionMeta)
    setDescriptionContent(session.descriptionContent)
    setProjectUid(session.projectUid ?? null)
  }, [])

  const updateDescriptionContent = (
    nextDescriptionContent: ContentLongtext,
    meta: MarkdownContentChangeMeta | null,
  ): void => {
    setDescriptionContent(nextDescriptionContent)
    setDescriptionMeta(meta)
    setDraft((previous) => syncDraftDescription(previous, nextDescriptionContent))
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
      const session = loadPublishProjectSession()
      if (session?.keepForRestore) {
        return
      }
      clearPublishProjectSession()
    }
  }, [])

  useEffect(() => {
    const returnState = parsePublishProjectReturnState(location.state)
    if (!returnState) {
      return
    }

    const restore = parsePublishProjectFormRestore(returnState.publishProjectRestore)
    if (restore) {
      applyPublishProjectSession({
        draft: restore.draft,
        descriptionMeta: restore.descriptionMeta,
        descriptionContent: restore.descriptionContent,
        projectUid: restore.projectUid,
      })
      markSaved()
    }

    if (typeof returnState.content === 'string' || typeof returnState.markdownResult === 'string') {
      const editorType = returnState.editorType ?? 'MARKDOWN'
      const content = returnState.content ?? returnState.markdownResult
      const nextDescriptionContent = createContentLongtextFromEditorSave(editorType, content)
      const nextMeta: MarkdownContentChangeMeta = { source: 'editor', fileName: null }

      setDescriptionContent(nextDescriptionContent)
      setDescriptionMeta(nextMeta)
      setDraft((previous) => syncDraftDescription(previous, nextDescriptionContent))
      markEdited()
    }

    navigate(location.pathname, { replace: true, state: null })
  }, [applyPublishProjectSession, location.pathname, location.state, markEdited, markSaved, navigate])

  const hasUnsavedChanges = useMemo(() => {
    void revisionTick
    if (!hasPublishProjectUserInput(draft, descriptionContent)) {
      return false
    }
    return editRevisionRef.current > savedRevision
  }, [descriptionContent, draft, revisionTick, savedRevision])

  const leaveGuard = usePublishLeaveGuard({
    hasUnsavedChanges,
    onConfirmLeave: clearPublishProjectSession,
  })

  const displaySummary = useMemo(
    () => resolvePublishSummary(draft.summary, descriptionContent.longtext),
    [descriptionContent.longtext, draft.summary],
  )

  const completionPercent = useMemo<number>(() => {
    const checkpoints = [
      draft.title.trim().length > 0,
      displaySummary.length > 0,
      descriptionContent.longtext.trim().length > 0,
      draft.amount.trim().length > 0,
      draft.skillTags.length > 0,
    ]
    const completedCount = checkpoints.filter(Boolean).length
    return Math.round((completedCount / checkpoints.length) * 100)
  }, [descriptionContent.longtext, displaySummary, draft])

  const updateField = <K extends keyof PublishProjectFormDraft>(key: K, value: PublishProjectFormDraft[K]): void => {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }))
    markEdited()
  }

  const setChannel = (channel: string): void => {
    setDraft((previous) => ({
      ...previous,
      channel,
      campusRecruitType:
        channel === 'campus' ? (previous.campusRecruitType ?? 'LAB_RECRUIT') : null,
    }))
    markEdited()
  }

  const setCampusRecruitType = (campusRecruitType: CampusRecruitType): void => {
    setDraft((previous) => ({
      ...previous,
      channel: 'campus',
      campusRecruitType,
    }))
    markEdited()
  }

  const handleDescriptionChange = (value: string, meta: MarkdownContentChangeMeta): void => {
    const nextDescriptionContent =
      meta.source === 'upload'
        ? createContentLongtext('MARKDOWN', value)
        : createContentLongtext(descriptionContent.editorType, value)

    updateDescriptionContent(nextDescriptionContent, meta)
  }

  const buildEditorLocationState = (): Pick<OnlineTextEditorLocationState, 'publishProjectRestore'> => {
    leaveGuard.allowNextNavigation()
    skipClearSessionRef.current = true
    persistSessionSnapshot()
    return {
      publishProjectRestore: {
        draft: syncDraftDescription(draft, descriptionContent),
        descriptionMeta,
        descriptionContent,
        projectUid,
      },
    }
  }

  const addSkillTag = (tag: string): void => {
    const normalizedTag = tag.trim()
    if (!normalizedTag || draft.skillTags.includes(normalizedTag)) {
      return
    }

    setDraft((previous) => ({
      ...previous,
      skillTags: [...previous.skillTags, normalizedTag],
    }))
    setTagInput('')
    markEdited()
  }

  const removeSkillTag = (tag: string): void => {
    setDraft((previous) => ({
      ...previous,
      skillTags: previous.skillTags.filter((item) => item !== tag),
    }))
    markEdited()
  }

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addSkillTag(tagInput)
    }
  }

  const toggleSuggestedTag = (tag: string): void => {
    if (draft.skillTags.includes(tag)) {
      removeSkillTag(tag)
      return
    }
    addSkillTag(tag)
  }

  const submitProject = async (
    publishAction: 'DRAFT' | 'PUBLISH',
    successMode: SubmitProjectSuccessMode = 'detail',
  ): Promise<boolean> => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const result = await submitPublishProject({
        draft,
        descriptionContent,
        projectUid,
        publishAction,
      })

      setProjectUid(result.projectUid)
      markSaved()

      if (successMode === 'preview') {
        skipClearSessionRef.current = true
        persistSessionSnapshot({ projectUid: result.projectUid })
        leaveGuard.allowNextNavigation()
        navigateToProjectDetail(
          navigate,
          syncDraftDescription(draft, descriptionContent),
          descriptionContent,
          'PREVIEW',
        )
        return true
      }

      clearProjectDetailPreview()
      skipClearSessionRef.current = true
      persistSessionSnapshot({ projectUid: result.projectUid })
      leaveGuard.allowNextNavigation()
      navigate(`/project-detail?uid=${encodeURIComponent(result.projectUid)}`)
      return true
    } catch (error) {
      const message =
        error instanceof ProjectsApiError ? error.message : '保存项目失败，请稍后重试'
      setSubmitError(message)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = (): void => {
    void submitProject('DRAFT', 'detail')
  }

  const handlePreview = (): void => {
    void submitProject('DRAFT', 'preview')
  }

  const handlePublish = (): void => {
    void submitProject('PUBLISH', 'detail')
  }

  return {
    draft,
    displaySummary,
    descriptionMeta,
    descriptionContent,
    tagInput,
    suggestedSkillTags,
    completionPercent,
    projectUid,
    isSubmitting,
    submitError,
    leavePromptOpen: leaveGuard.leavePromptOpen,
    leavePromptMessage: leaveGuard.leavePromptMessage,
    confirmLeave: leaveGuard.confirmLeave,
    cancelLeave: leaveGuard.cancelLeave,
    setTagInput,
    updateField,
    setChannel,
    setCampusRecruitType,
    handleDescriptionChange,
    buildEditorLocationState,
    addSkillTag,
    removeSkillTag,
    handleTagInputKeyDown,
    toggleSuggestedTag,
    handleSaveDraft,
    handlePreview,
    handlePublish,
  }
}

export type PublishProjectFormModel = ReturnType<typeof usePublishProjectForm>
