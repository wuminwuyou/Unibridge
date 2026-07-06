// 01）右侧栏·基本信息卡片（ProjectRightBasicInfoCard）
// 包含：标题字段 + 摘要字段 + 技能标签编辑器
import { FileText } from 'lucide-react'
import { FormSectionCard } from '@shared/ui/FormSectionCard'
import {
  ProjectTitleField,
  ProjectSummaryField,
  SkillTagsEditor,
} from '@features/project-publish'

export interface ProjectRightBasicInfoCardProps {
  title: string
  summary: string
  onTitleChange: (v: string) => void
  onSummaryChange: (v: string) => void
  /** SkillTagsEditor 相关 props */
  tags: string[]
  tagInput: string
  suggestedSkillTags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  onTagInputChange: (v: string) => void
  onToggleSuggestedTag: (tag: string) => void
  onTagInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function ProjectRightBasicInfoCard({
  title,
  summary,
  onTitleChange,
  onSummaryChange,
  tags,
  tagInput,
  suggestedSkillTags,
  onAddTag,
  onRemoveTag,
  onTagInputChange,
  onToggleSuggestedTag,
  onTagInputKeyDown,
}: ProjectRightBasicInfoCardProps) {
  return (
    <FormSectionCard
      icon={<FileText className="h-5 w-5" />}
      title="基本信息"
      description="用于列表卡片与搜索展示"
    >
      <ProjectTitleField value={title} onChange={onTitleChange} />
      <ProjectSummaryField value={summary} onChange={onSummaryChange} />
      <SkillTagsEditor
        tags={tags}
        tagInput={tagInput}
        suggestedTags={suggestedSkillTags}
        onAdd={onAddTag}
        onRemove={onRemoveTag}
        onTagInputChange={onTagInputChange}
        onToggleSuggested={onToggleSuggestedTag}
        onTagInputKeyDown={onTagInputKeyDown}
      />
    </FormSectionCard>
  )
}
