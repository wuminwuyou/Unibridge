// 01）合作信息段区块（ProjectCooperationBlock）
// 组合 FormSectionCard + 预算/周期/等级/人数/截止字段
import { CircleDollarSign } from 'lucide-react'
import { FormSectionCard } from '@shared/ui/FormSectionCard'
import type { ReactNode } from 'react'

export interface ProjectCooperationBlockProps {
  children?: ReactNode
}

export function ProjectCooperationBlock({ children }: ProjectCooperationBlockProps) {
  return (
    <FormSectionCard
      icon={<CircleDollarSign className="h-5 w-5" />}
      title="合作信息"
      description="预算、周期与团队规模"
    >
      {children}
    </FormSectionCard>
  )
}
