// 01）发布项目左栏表单（ProjectPublishForm）
// 组装三个独立卡片：频道选择 + 需求详情 + 项目内容详细描述（含评估按钮 + 结果卡片）
import { FolderKanban, Layers3, FileDigit, Sparkles } from 'lucide-react'
import { FormSectionCard } from '@shared/ui/FormSectionCard'
import {
  ChannelPicker,
  DescriptionEditor,
} from '@features/project-publish'
import type { EvaluateProjectResponse } from '@features/project-publish/api/evaluateProjectApi'
import { ProjectEvaluateCard } from '@features/project-publish/components/ProjectEvaluateCard'
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
  /** Markdown 项目内容详细描述（与需求详情同为评估必填项——加密后用于项目难度评估） */
  contentDetailValue: string
  onContentDetailChange: (v: string) => void
  /** 难度评估状态 */
  evaluateResult: EvaluateProjectResponse | null
  isEvaluating: boolean
  evaluateError: string | null
  onEvaluate: () => void
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
  evaluateResult,
  isEvaluating,
  evaluateError,
  onEvaluate,
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
          maxLength={5000}
          toolbarsExcludeExtra={PROJECT_PUBLISH_EXCLUDED_TOOLBARS}
        />

        {/* 评估错误信息 */}
        {evaluateError && (
          <p className={styles.evaluateError}>{evaluateError}</p>
        )}

        {/* 评估按钮 */}
        <button
          type="button"
          className={styles.evaluateButton}
          disabled={isEvaluating || !descriptionValue.trim() || !contentDetailValue.trim()}
          onClick={onEvaluate}
        >
          <Sparkles className="h-4 w-4" />
          {isEvaluating ? '评估中...' : '提交难度评估'}
        </button>

        {/* 评估结果卡片 */}
        {evaluateResult && <ProjectEvaluateCard result={evaluateResult} />}
      </FormSectionCard>
    </main>
  )
}
