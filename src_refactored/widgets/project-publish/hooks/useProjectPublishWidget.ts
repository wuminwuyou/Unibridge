// 01）发布项目 Widget Hook（useProjectPublishWidget）
/**
 * 函数名：useProjectPublishWidget
 * 功能：管理发布项目表单的全部 state 与副作用——草稿/预览/发布、session 持久化、离开拦截。
 * 实现方法：
 * - 从 features/project-publish 导入所有 service/session/constants
 * - 编辑器已内联（shared/ui/MarkdownEditor），不再跳独立页
 * - 通过 leaveGuard 拦截未保存离开
 * 输入：无
 * 输出：
 * - 返回值：完整的 form model（draft/displaySummary/完成度/提交函数等）
 * - 副作用：sessionStorage 读写、路由跳转
 */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePublishLeaveGuard } from '@shared/hooks/usePublishLeaveGuard'
import { resolvePublishSummary } from '@shared/lib/publishSummary'
import {
  createDefaultContentLongtext,
  createContentLongtext,
  type ContentLongtext,
} from '@entities/editor/lib/contentLongtext'
import type { ProjectResourceUid } from '@shared/api/resourceUid'
import {
  submitPublishProject,
  ProjectsApiError,
  clearPublishProjectSession,
  loadPublishProjectSession,
  savePublishProjectSession,
  hasPublishProjectUserInput,
  navigateToProjectDetail,
  clearProjectDetailPreview,
  createDefaultPublishProjectDraft,
  suggestedSkillTags,
  publishChecklistItems,
  resolvePublishPreviewBadge,
} from '@features/project-publish'
import type { PublishProjectFormDraft } from '@features/project-publish'
import type { CampusRecruitType } from '@shared/types/project'

// 02）同步需求说明 longtext 到 draft（syncDraftDescription）
function syncDraftDescription(draft: PublishProjectFormDraft, descriptionContent: ContentLongtext): PublishProjectFormDraft {
  return { ...draft, description: descriptionContent.longtext }
}

// 03）提交成功后的跳转方式（SubmitProjectSuccessMode）
type SubmitProjectSuccessMode = 'detail' | 'preview'

// 04）发布项目 Widget Hook 返回值（ProjectPublishWidgetModel）
export type ProjectPublishWidgetModel = ReturnType<typeof useProjectPublishWidget>

// 05）useProjectPublishWidget
export function useProjectPublishWidget() {
  const navigate = useNavigate()
  const initialSessionRef = useRef(loadPublishProjectSession())
  const skipClearSessionRef = useRef(false)
  const editRevisionRef = useRef(0)
  const [savedRevision, setSavedRevision] = useState(0)
  const [revisionTick, setRevisionTick] = useState(0)

  const [draft, setDraft] = useState<PublishProjectFormDraft>(
    () => initialSessionRef.current?.draft ?? createDefaultPublishProjectDraft(),
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

  const persistSessionSnapshot = useCallback((): void => {
    savePublishProjectSession({
      draft: syncDraftDescription(draft, descriptionContent),
      descriptionMeta: null,
      descriptionContent,
      projectUid,
      keepForRestore: true,
    })
  }, [descriptionContent, draft, projectUid])

  useEffect(() => {
    if (initialSessionRef.current) markSaved()
  }, [markSaved])

  useEffect(() => {
    return () => {
      if (skipClearSessionRef.current) return
      const session = loadPublishProjectSession()
      if (session?.keepForRestore) return
      clearPublishProjectSession()
    }
  }, [])

  const hasUnsavedChanges = useMemo(() => {
    void revisionTick
    if (!hasPublishProjectUserInput(draft, descriptionContent)) return false
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
    setDraft((previous) => ({ ...previous, [key]: value }))
    markEdited()
  }

  const setChannel = (channel: string): void => {
    setDraft((previous) => ({
      ...previous,
      channel,
      campusRecruitType: channel === 'campus' ? (previous.campusRecruitType ?? 'LAB_RECRUIT') : null,
    }))
    markEdited()
  }

  const setCampusRecruitType = (campusRecruitType: CampusRecruitType): void => {
    setDraft((previous) => ({
      ...previous, channel: 'campus', campusRecruitType,
    }))
    markEdited()
  }

  const handleDescriptionChange = (value: string): void => {
    const nextContent = createContentLongtext(descriptionContent.editorType, value)
    setDescriptionContent(nextContent)
    setDraft((previous) => syncDraftDescription(previous, nextContent))
    markEdited()
  }

  const addSkillTag = (tag: string): void => {
    const normalizedTag = tag.trim()
    if (!normalizedTag || draft.skillTags.includes(normalizedTag)) return
    setDraft((previous) => ({ ...previous, skillTags: [...previous.skillTags, normalizedTag] }))
    setTagInput('')
    markEdited()
  }

  const removeSkillTag = (tag: string): void => {
    setDraft((previous) => ({ ...previous, skillTags: previous.skillTags.filter((item) => item !== tag) }))
    markEdited()
  }

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') { event.preventDefault(); addSkillTag(tagInput) }
  }

  const toggleSuggestedTag = (tag: string): void => {
    if (draft.skillTags.includes(tag)) { removeSkillTag(tag); return }
    addSkillTag(tag)
  }

  const submitProject = async (
    publishAction: 'DRAFT' | 'PUBLISH',
    successMode: SubmitProjectSuccessMode = 'detail',
  ): Promise<boolean> => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const result = await submitPublishProject({ draft, descriptionContent, projectUid, publishAction })
      setProjectUid(result.projectUid)
      markSaved()

      if (successMode === 'preview') {
        skipClearSessionRef.current = true
        persistSessionSnapshot()
        leaveGuard.allowNextNavigation()
        navigateToProjectDetail(navigate, syncDraftDescription(draft, descriptionContent), descriptionContent, 'PREVIEW')
        return true
      }

      clearProjectDetailPreview()
      skipClearSessionRef.current = true
      persistSessionSnapshot()
      leaveGuard.allowNextNavigation()
      navigate(`/project-detail?uid=${encodeURIComponent(result.projectUid)}`)
      return true
    } catch (error) {
      const message = error instanceof ProjectsApiError ? error.message : '保存项目失败，请稍后重试'
      setSubmitError(message)
      return false
    } finally { setIsSubmitting(false) }
  }

  return {
    draft, displaySummary, descriptionContent, tagInput, completionPercent, projectUid,
    isSubmitting, submitError,
    leavePromptOpen: leaveGuard.leavePromptOpen,
    leavePromptMessage: leaveGuard.leavePromptMessage,
    confirmLeave: leaveGuard.confirmLeave, cancelLeave: leaveGuard.cancelLeave,
    setTagInput, updateField, setChannel, setCampusRecruitType,
    handleDescriptionChange, addSkillTag, removeSkillTag,
    handleTagInputKeyDown, toggleSuggestedTag,
    handleSaveDraft: () => { void submitProject('DRAFT', 'detail') },
    handlePreview: () => { void submitProject('DRAFT', 'preview') },
    handlePublish: () => { void submitProject('PUBLISH', 'detail') },
    suggestedSkillTags, publishChecklistItems, resolvePublishPreviewBadge,
  }
}
