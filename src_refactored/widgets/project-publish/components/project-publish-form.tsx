// 01）发布项目左栏表单（ProjectPublishForm）
// 组装三个独立卡片：频道选择 + 需求详情 + 项目内容详细描述
import { FolderKanban, Layers3, FileDigit } from 'lucide-react'
import { FormSectionCard } from '@shared/ui/FormSectionCard'
import {
  ChannelPicker,
  DescriptionEditor,
} from '@features/project-publish'
import type { CampusRecruitType } from '@shared/types/project'
import styles from './project-publish-form.module.css'

/** 项目发布页额外禁用的 Markdown 工具栏按钮 */
const PROJECT_PUBLISH_EXCLUDED_TOOLBARS = ['image', 'mermaid', 'katex'] as const

export interface ProjectPublishFormProps {
  /** 频道 + 校园招募类型 */
  channel: string
  campusRecruitType: CampusRecruitType | null
  onChannelChange: (v: string) => void
  onCampusRecruitTypeChange: (v: CampusRecruitType) => void
  /** Markdown 需求详情（必填——对外展示的招募需求） */
  descriptionValue: string
  onDescriptionChange: (v: string) => void
  /** Markdown 项目内容详细描述（非必填——加密后用于项目难度评估） */
  contentDetailValue: string
  onContentDetailChange: (v: string) => void
}

export function ProjectPublishForm({
  channel,
  campusRecruitType,
  descriptionValue,
  contentDetailValue,
  onChannelChange,
  onCampusRecruitTypeChange,
  onDescriptionChange,
  onContentDetailChange,
}: ProjectPublishFormProps) {
  return (
    <main className={styles.root}>
      <FormSectionCard
        icon={<FolderKanban className="h-5 w-5" />}
        title="发布频道"
        description="选择项目发布渠道"
      >
        <ChannelPicker
          channel={channel}
          campusRecruitType={campusRecruitType}
          onChannelChange={onChannelChange}
          onCampusRecruitTypeChange={onCampusRecruitTypeChange}
        />
      </FormSectionCard>

      <FormSectionCard
        icon={<Layers3 className="h-5 w-5" />}
        title="需求详情"
        description="使用 Markdown 编辑器录入项目需求说明"
      >
        <DescriptionEditor
          value={descriptionValue}
          onChange={onDescriptionChange}
          required
          toolbarsExcludeExtra={PROJECT_PUBLISH_EXCLUDED_TOOLBARS}
        />
      </FormSectionCard>

      <FormSectionCard
        icon={<FileDigit className="h-5 w-5" />}
        title="项目内容详细描述"
        description="使用 Markdown 编辑器录入项目内容说明，加密后用于项目难度评估"
      >
        <DescriptionEditor
          value={contentDetailValue}
          onChange={onContentDetailChange}
          maxLength={3000}
          toolbarsExcludeExtra={PROJECT_PUBLISH_EXCLUDED_TOOLBARS}
        />
      </FormSectionCard>
    </main>
  )
}
