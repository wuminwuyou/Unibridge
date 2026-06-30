// 01）项目表单字段统一导出（ProjectFormFields）
// 所有单个表单字段统一在此文件定义，不拆分为 entities 单文件

import { FormInput, FormSelectInput } from '@shared/ui/input'

// 02）项目标题字段
export function ProjectTitleField({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <FormInput
      label="项目标题"
      required
      value={value}
      onChange={onChange}
      placeholder="例如：电商平台用户增长数据分析"
      disabled={disabled}
    />
  )
}

// 03）一句话摘要字段
export function ProjectSummaryField({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <FormInput
      label="一句话摘要"
      required
      value={value}
      onChange={onChange}
      placeholder="可留空，未填写时将自动从需求说明提取前 50 字"
      disabled={disabled}
    />
  )
}

// 04）预算 / 金额字段
export function ProjectAmountField({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <FormInput
      label="预算 / 金额"
      required
      value={value}
      onChange={onChange}
      placeholder="例如：¥3000 - ¥5000"
      disabled={disabled}
    />
  )
}

// 05）能力等级字段
export function ProjectLevelField({ value, options, onChange, disabled }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <FormSelectInput
      label="能力等级"
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
    />
  )
}

// 06）预计周期字段（带 Clock3 图标）
export { default as ProjectDurationField } from './ProjectDurationField'
export type { ProjectDurationFieldProps } from './ProjectDurationField'

// 07）团队人数字段（带 Users 图标）
export { default as ProjectTeamSizeField } from './ProjectTeamSizeField'
export type { ProjectTeamSizeFieldProps } from './ProjectTeamSizeField'

// 08）报名截止日期字段
export { default as ProjectDeadlineField } from './ProjectDeadlineField'
export type { ProjectDeadlineFieldProps } from './ProjectDeadlineField'
