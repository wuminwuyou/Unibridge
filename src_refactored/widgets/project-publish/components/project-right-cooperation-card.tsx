// 01）右侧栏·合作信息卡片（ProjectRightCooperationCard）
// 包含：预算区间 + 等级 + 周期 + 截止日期
import { CircleDollarSign } from 'lucide-react'
import { FormSectionCard } from '@shared/ui/FormSectionCard'
import {
  ProjectBudgetRangeField,
  ProjectLevelField,
  ProjectDurationField,
  ProjectDeadlineField,
} from '@features/project-publish'
import { LEVEL_OPTIONS } from '@shared/lib/levelConstants'
import styles from './project-publish-preview.module.css'

export interface ProjectRightCooperationCardProps {
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

export function ProjectRightCooperationCard({
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
}: ProjectRightCooperationCardProps) {
  const levelOptions = LEVEL_OPTIONS

  return (
    <FormSectionCard
      icon={<CircleDollarSign className="h-5 w-5" />}
      title="合作信息"
      description="预算、周期与能力要求"
    >
      <ProjectBudgetRangeField
        minValue={amountMin}
        maxValue={amountMax}
        onMinChange={onAmountMinChange}
        onMaxChange={onAmountMaxChange}
      />
      <div className={styles.cooperationGrid}>
        <ProjectLevelField value={level} options={levelOptions} onChange={onLevelChange} />
        <ProjectDurationField value={duration} onChange={onDurationChange} />
      </div>
      <ProjectDeadlineField value={deadline} onChange={onDeadlineChange} />
    </FormSectionCard>
  )
}
