// 01）表单字段操作 Hook（useNoteEditorFormActions）
import { useCallback, type KeyboardEvent } from 'react'
import { createContentLongtext, type ContentLongtext } from '@entities/editor/lib/contentLongtext'
import { type NoteEditorFormDraft } from '@features/note-editor'
import { syncNoteEditorDraftBody } from '../lib/noteEditorFormUtils'

// 02）Hook 选项（UseNoteEditorFormActionsOptions）
export interface UseNoteEditorFormActionsOptions {
  draft: NoteEditorFormDraft
  bodyContent: ContentLongtext
  tagInput: string
  onDraftChange: (updater: (previous: NoteEditorFormDraft) => NoteEditorFormDraft) => void
  onBodyContentChange: (next: ContentLongtext) => void
  onTagInputChange: (value: string) => void
  onMarkEdited: () => void
  onPersistedCoverUrlChange: (url: string) => void
}

// 03）Hook 返回值（UseNoteEditorFormActionsResult）
export interface UseNoteEditorFormActionsResult {
  updateField: <K extends keyof NoteEditorFormDraft>(key: K, value: NoteEditorFormDraft[K]) => void
  handleBodyChange: (value: string) => void
  addTag: (tag: string) => void
  removeTag: (tag: string) => void
  handleTagInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  toggleSuggestedTag: (tag: string) => void
}

/**
 * 函数名：useNoteEditorFormActions
 * 功能：封装笔记编辑表单的字段变更、正文同步与标签增减操作。
 * 输入：
 * - options：草稿、正文、封面 picker、变更回调
 * 输出：
 * - 返回值：表单操作 handlers
 * - 副作用：无（通过回调发射）
 */
export function useNoteEditorFormActions(
  options: UseNoteEditorFormActionsOptions,
): UseNoteEditorFormActionsResult {
  const {
    draft,
    bodyContent,
    tagInput,
    onDraftChange,
    onBodyContentChange,
    onTagInputChange,
    onMarkEdited,
    onPersistedCoverUrlChange,
  } = options

  const updateField = useCallback(
    <K extends keyof NoteEditorFormDraft>(key: K, value: NoteEditorFormDraft[K]): void => {
      onDraftChange((previous) => ({ ...previous, [key]: value }))
      if (key === 'coverUrl' && typeof value === 'string') {
        onPersistedCoverUrlChange(value)
      }
      onMarkEdited()
    },
    [onDraftChange, onMarkEdited, onPersistedCoverUrlChange],
  )

  const handleBodyChange = useCallback(
    (value: string): void => {
      const nextBodyContent = createContentLongtext(bodyContent.editorType, value)
      onBodyContentChange(nextBodyContent)
      onDraftChange((previous) => syncNoteEditorDraftBody(previous, nextBodyContent))
      onMarkEdited()
    },
    [bodyContent.editorType, onBodyContentChange, onDraftChange, onMarkEdited],
  )

  const addTag = useCallback(
    (tag: string): void => {
      const normalizedTag = tag.trim()
      if (!normalizedTag || draft.tags.includes(normalizedTag)) {
        return
      }
      onDraftChange((previous) => ({ ...previous, tags: [...previous.tags, normalizedTag] }))
      onTagInputChange('')
      onMarkEdited()
    },
    [draft.tags, onDraftChange, onMarkEdited, onTagInputChange],
  )

  const removeTag = useCallback(
    (tag: string): void => {
      onDraftChange((previous) => ({
        ...previous,
        tags: previous.tags.filter((item) => item !== tag),
      }))
      onMarkEdited()
    },
    [onDraftChange, onMarkEdited],
  )

  const handleTagInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        event.preventDefault()
        addTag(tagInput)
      }
    },
    [addTag, tagInput],
  )

  const toggleSuggestedTag = useCallback(
    (tag: string): void => {
      if (draft.tags.includes(tag)) {
        removeTag(tag)
        return
      }
      addTag(tag)
    },
    [addTag, draft.tags, removeTag],
  )

  return {
    updateField,
    handleBodyChange,
    addTag,
    removeTag,
    handleTagInputKeyDown,
    toggleSuggestedTag,
  }
}
