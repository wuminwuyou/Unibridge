// 01）基本信息段区块（ProjectBasicInfoBlock）
// 组合 FormSectionCard + 标题/摘要表单字段 + features ChannelPicker slot
import { FolderKanban } from 'lucide-react'
import { FormSectionCard } from '@shared/ui/FormSectionCard'
import { ProjectTitleField, ProjectSummaryField } from '@features/project-publish/components/ProjectFormFields'
import type { ReactNode } from 'react'

export interface ProjectBasicInfoBlockProps {
  title: string
  summary: string
  onTitleChange: (v: string) => void
  onSummaryChange: (v: string) => void
  /** features 交互组件插槽（如 ChannelPicker） */
  children?: ReactNode
}

export function ProjectBasicInfoBlock({ title, summary, onTitleChange, onSummaryChange, children }: ProjectBasicInfoBlockProps) {
  return (
    <FormSectionCard
      icon={<FolderKanban className="h-5 w-5" />}
      title="基本信息"
      description="用于列表卡片与搜索展示"
    >
      <ProjectTitleField value={title} onChange={onTitleChange} />
      <ProjectSummaryField value={summary} onChange={onSummaryChange} />
      {children}
    </FormSectionCard>
  )
}
