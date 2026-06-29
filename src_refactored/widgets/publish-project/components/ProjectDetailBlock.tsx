// 01）需求详情段区块（ProjectDetailBlock）
// 组合 FormSectionCard + DescriptionEditor + SkillTagsEditor
import { Layers3 } from 'lucide-react'
import { FormSectionCard } from '@shared/ui/FormSectionCard'
import type { ReactNode } from 'react'

export interface ProjectDetailBlockProps {
  children?: ReactNode
}

export function ProjectDetailBlock({ children }: ProjectDetailBlockProps) {
  return (
    <FormSectionCard
      icon={<Layers3 className="h-5 w-5" />}
      title="需求详情"
      description="使用 Markdown 编辑器录入项目需求说明"
    >
      {children}
    </FormSectionCard>
  )
}
