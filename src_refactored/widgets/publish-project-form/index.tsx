// 01）发布项目表单 Widget（PublishProjectFormWidget）
// 组装三个 Block + features 交互组件 + 返回链接 + 完成度显示
import { ProjectBasicInfoBlock } from '@widgets/publish-project/components/ProjectBasicInfoBlock'
import { ProjectDetailBlock } from '@widgets/publish-project/components/ProjectDetailBlock'
import { ProjectCooperationBlock } from '@widgets/publish-project/components/ProjectCooperationBlock'
import {
  ProjectAmountField,
  ProjectLevelField,
} from '@features/project-publish/components/ProjectFormFields'
import ProjectDurationField from '@features/project-publish/components/ProjectDurationField'
import ProjectTeamSizeField from '@features/project-publish/components/ProjectTeamSizeField'
import ProjectDeadlineField from '@features/project-publish/components/ProjectDeadlineField'
import { ChannelPicker } from '@features/project-publish/components/ChannelPicker'
import { SkillTagsEditor } from '@features/project-publish/components/SkillTagsEditor'
import { DescriptionEditor } from '@features/project-publish/components/DescriptionEditor'
import { publishLevelOptions } from '@features/project-publish'
import type { CampusRecruitType } from '@shared/types/project'
import styles from './PublishProjectFormWidget.module.css'

export interface PublishProjectFormWidgetProps {
  draft: {
    title: string
    summary: string
    channel: string
    campusRecruitType: CampusRecruitType | null
    amount: string
    level: string
    duration: string
    teamSize: string
    skillTags: string[]
    deadline: string
  }
  descriptionValue: string
  tagInput: string
  suggestedSkillTags: string[]
  completionPercent: number
  onTitleChange: (v: string) => void
  onSummaryChange: (v: string) => void
  onAmountChange: (v: string) => void
  onLevelChange: (v: string) => void
  onDurationChange: (v: string) => void
  onTeamSizeChange: (v: string) => void
  onDeadlineChange: (v: string) => void
  onChannelChange: (v: string) => void
  onCampusRecruitTypeChange: (v: CampusRecruitType) => void
  onDescriptionChange: (v: string) => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  onTagInputChange: (v: string) => void
  onToggleSuggestedTag: (tag: string) => void
  onTagInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function PublishProjectFormWidget({
  draft,
  descriptionValue,
  tagInput,
  suggestedSkillTags,
  // 已完成：completionPercent 用于页面 header 显示，此处预留
  onTitleChange,
  onSummaryChange,
  onAmountChange,
  onLevelChange,
  onDurationChange,
  onTeamSizeChange,
  onDeadlineChange,
  onChannelChange,
  onCampusRecruitTypeChange,
  onDescriptionChange,
  onAddTag,
  onRemoveTag,
  onTagInputChange,
  onToggleSuggestedTag,
  onTagInputKeyDown,
}: PublishProjectFormWidgetProps) {
  const levelOptions = publishLevelOptions.map((lv) => ({ value: lv, label: lv }))

  return (
    <main className={styles.root}>
      <ProjectBasicInfoBlock
        title={draft.title}
        summary={draft.summary}
        onTitleChange={onTitleChange}
        onSummaryChange={onSummaryChange}
      >
        <ChannelPicker
          channel={draft.channel}
          campusRecruitType={draft.campusRecruitType}
          onChannelChange={onChannelChange}
          onCampusRecruitTypeChange={onCampusRecruitTypeChange}
        />
      </ProjectBasicInfoBlock>

      <ProjectDetailBlock>
        <DescriptionEditor
          value={descriptionValue}
          onChange={onDescriptionChange}
          required
        />
        <SkillTagsEditor
          tags={draft.skillTags}
          tagInput={tagInput}
          suggestedTags={suggestedSkillTags}
          onAdd={onAddTag}
          onRemove={onRemoveTag}
          onTagInputChange={onTagInputChange}
          onToggleSuggested={onToggleSuggestedTag}
          onTagInputKeyDown={onTagInputKeyDown}
        />
      </ProjectDetailBlock>

      <ProjectCooperationBlock>
        <div className={styles.cooperationGrid}>
          <ProjectAmountField value={draft.amount} onChange={onAmountChange} />
          <ProjectDurationField value={draft.duration} onChange={onDurationChange} />
          <ProjectLevelField value={draft.level} options={levelOptions} onChange={onLevelChange} />
          <ProjectTeamSizeField value={draft.teamSize} onChange={onTeamSizeChange} />
        </div>
        <ProjectDeadlineField value={draft.deadline} onChange={onDeadlineChange} />
      </ProjectCooperationBlock>
    </main>
  )
}
