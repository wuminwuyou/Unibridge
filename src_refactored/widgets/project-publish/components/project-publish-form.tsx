// 01）发布项目表单（ProjectPublishForm）
// 组装三个 Block + features 交互组件
import { ProjectBasicInfoBlock } from './project-basic-info-block'
import { ProjectDetailBlock } from './project-detail-block'
import { ProjectCooperationBlock } from './project-cooperation-block'
import {
  ProjectAmountField,
  ProjectLevelField,
  ProjectDurationField,
  ProjectTeamSizeField,
  ProjectDeadlineField,
  ChannelPicker,
  SkillTagsEditor,
  DescriptionEditor,
  publishLevelOptions,
} from '@features/project-publish'
import type { CampusRecruitType } from '@shared/types/project'
import styles from './project-publish-form.module.css'

export interface ProjectPublishFormProps {
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

export function ProjectPublishForm({
  draft,
  descriptionValue,
  tagInput,
  suggestedSkillTags,
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
}: ProjectPublishFormProps) {
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
