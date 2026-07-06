// 01）发布项目右侧栏（ProjectPublishRightColumn）
// 组合 基本信息卡片 + 合作信息卡片，替代原 ProjectPublishPreview
import { ProjectRightBasicInfoCard } from './project-right-basic-info-card'
import { ProjectRightCooperationCard } from './project-right-cooperation-card'
import styles from './project-publish-preview.module.css'

export interface ProjectPublishRightColumnProps {
  /** 基本信息 */
  title: string
  summary: string
  onTitleChange: (v: string) => void
  onSummaryChange: (v: string) => void
  /** 技能标签 */
  tags: string[]
  tagInput: string
  suggestedSkillTags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  onTagInputChange: (v: string) => void
  onToggleSuggestedTag: (tag: string) => void
  onTagInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  /** 合作信息 */
  amountMin: string
  amountMax: string
  level: string
  duration: string
  deadline: string
  onAmountMinChange: (v: string) => void
  onAmountMaxChange: (v: string) => void
  onLevelChange: (v: string) => void
  onDurationChange: (v: string) => void
  onDeadlineChange: (v: string) => void
}

export function ProjectPublishRightColumn({
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
  amountMin,
  amountMax,
  level,
  duration,
  deadline,
  onAmountMinChange,
  onAmountMaxChange,
  onLevelChange,
  onDurationChange,
  onDeadlineChange,
}: ProjectPublishRightColumnProps) {
  return (
    <aside className={styles.aside}>
      <ProjectRightBasicInfoCard
        title={title}
        summary={summary}
        onTitleChange={onTitleChange}
        onSummaryChange={onSummaryChange}
        tags={tags}
        tagInput={tagInput}
        suggestedSkillTags={suggestedSkillTags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
        onTagInputChange={onTagInputChange}
        onToggleSuggestedTag={onToggleSuggestedTag}
        onTagInputKeyDown={onTagInputKeyDown}
      />
      <ProjectRightCooperationCard
        amountMin={amountMin}
        amountMax={amountMax}
        level={level}
        duration={duration}
        deadline={deadline}
        onAmountMinChange={onAmountMinChange}
        onAmountMaxChange={onAmountMaxChange}
        onLevelChange={onLevelChange}
        onDurationChange={onDurationChange}
        onDeadlineChange={onDeadlineChange}
      />
    </aside>
  )
}
