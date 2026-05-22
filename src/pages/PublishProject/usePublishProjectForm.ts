import { useMemo, useState, type KeyboardEvent } from 'react'
import {
  createDefaultPublishProjectDraft,
  suggestedSkillTags,
  type PublishProjectFormDraft,
} from './publishProjectPageData'

// 01）发布项目表单 Hook（usePublishProjectForm）
/**
 * 函数名：usePublishProjectForm
 * 功能：管理发布项目原型页的表单状态、标签选择与完成度提示。
 * 实现方法：
 * - useState 维护 PublishProjectFormDraft
 * - 提供字段更新与技能标签增删方法
 * - 根据必填项计算完成进度（仅 UI 原型，不提交后端）
 * 输入：无
 * 输出：
 * - 返回值：表单状态、处理器与派生进度
 * - 副作用：无
 */
export function usePublishProjectForm() {
  const [draft, setDraft] = useState<PublishProjectFormDraft>(() => createDefaultPublishProjectDraft())
  const [tagInput, setTagInput] = useState<string>('')

  const completionPercent = useMemo<number>(() => {
    const checkpoints = [
      draft.title.trim().length > 0,
      draft.summary.trim().length > 0,
      draft.description.trim().length > 0,
      draft.amount.trim().length > 0,
      draft.skillTags.length > 0,
    ]
    const completedCount = checkpoints.filter(Boolean).length
    return Math.round((completedCount / checkpoints.length) * 100)
  }, [draft])

  const updateField = <K extends keyof PublishProjectFormDraft>(key: K, value: PublishProjectFormDraft[K]): void => {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }))
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
  }

  const removeSkillTag = (tag: string): void => {
    setDraft((previous) => ({
      ...previous,
      skillTags: previous.skillTags.filter((item) => item !== tag),
    }))
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

  const handleSaveDraft = (): void => {
    console.info('[PublishProject] 保存草稿（原型）', draft)
  }

  const handlePreview = (): void => {
    console.info('[PublishProject] 预览项目卡片（原型）', draft)
  }

  const handlePublish = (): void => {
    console.info('[PublishProject] 提交发布（原型）', draft)
  }

  return {
    draft,
    tagInput,
    suggestedSkillTags,
    completionPercent,
    setTagInput,
    updateField,
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
