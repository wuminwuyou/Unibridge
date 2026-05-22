import { useMemo, useState, type KeyboardEvent } from 'react'
import {
  createDefaultPublishNoteDraft,
  suggestedNoteTags,
  type PublishNoteContentType,
  type PublishNoteFormDraft,
} from './publishNotePageData'

// 01）发布笔记表单 Hook（usePublishNoteForm）
/**
 * 函数名：usePublishNoteForm
 * 功能：管理发布笔记原型页的表单状态、标签与完成度。
 * 实现方法：
 * - useState 维护 PublishNoteFormDraft
 * - 提供字段更新与标签增删
 * - 根据必填项计算完成进度
 * 输入：无
 * 输出：
 * - 返回值：表单状态、处理器与派生进度
 * - 副作用：无
 */
export function usePublishNoteForm() {
  const [draft, setDraft] = useState<PublishNoteFormDraft>(() => createDefaultPublishNoteDraft())
  const [tagInput, setTagInput] = useState<string>('')

  const completionPercent = useMemo<number>(() => {
    const checkpoints = [
      draft.title.trim().length > 0,
      draft.summary.trim().length > 0,
      draft.body.trim().length > 0,
      draft.tags.length > 0,
    ]
    const completedCount = checkpoints.filter(Boolean).length
    return Math.round((completedCount / checkpoints.length) * 100)
  }, [draft])

  const updateField = <K extends keyof PublishNoteFormDraft>(key: K, value: PublishNoteFormDraft[K]): void => {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }))
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
  }

  const removeTag = (tag: string): void => {
    setDraft((previous) => ({
      ...previous,
      tags: previous.tags.filter((item) => item !== tag),
    }))
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

  const setContentType = (contentType: PublishNoteContentType): void => {
    updateField('contentType', contentType)
  }

  const handleSaveDraft = (): void => {
    console.info('[PublishNote] 保存草稿（原型）', draft)
  }

  const handlePreview = (): void => {
    console.info('[PublishNote] 预览笔记卡片（原型）', draft)
  }

  const handlePublish = (): void => {
    console.info('[PublishNote] 提交发布（原型）', draft)
  }

  return {
    draft,
    tagInput,
    suggestedNoteTags,
    completionPercent,
    setTagInput,
    updateField,
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
