// 01）发布项目 Feature 公开接口
export type { PublishProjectFormDraft, CampusRecruitOption, PublishChannelOption, ProjectPublishAction } from './model/types'

export {
  campusRecruitOptions,
  publishChannelOptions,
  suggestedSkillTags,
  publishChecklistItems,
  resolvePublishPreviewBadge,
  createDefaultPublishProjectDraft,
} from './constants/publishOptions'

// resolveProjectChannelLabel 已下沉至 @entities/project，改为 re-export
export { resolveProjectChannelLabel } from '@entities/project'

export {
  ProjectTitleField,
  ProjectSummaryField,
  ProjectAmountField,
  ProjectLevelField,
  ProjectDurationField,
  ProjectDeadlineField,
  ProjectBudgetRangeField,
} from './components/fields'

export type {
  ProjectDurationFieldProps,
  ProjectDeadlineFieldProps,
  ProjectBudgetRangeFieldProps,
} from './components/fields'

export { ChannelPicker, CampusRecruitOptionCard } from './components/pickers'
export type { ChannelPickerProps, CampusRecruitOptionCardProps } from './components/pickers'

export { SkillTagsEditor, DescriptionEditor } from './components/editors'
export type { SkillTagsEditorProps, DescriptionEditorProps } from './components/editors'

export {
  loadPublishProjectSession,
  savePublishProjectSession,
  clearPublishProjectSession,
  createPublishProjectFormRestore,
} from './lib/publishFormSession'
export type { PublishProjectSession, PublishProjectFormRestore } from './lib/publishFormSession'

export { hasPublishProjectUserInput } from './lib/publishProjectFormUtils'

export {
  buildProjectDetailPayload,
} from './lib/buildProjectDetailPayload'

// ProjectDetail 类型已下沉 @entities/project，re-export 保持发布页现有消费方不 broken
export type {
  ProjectDetailPublishStatus,
  ProjectDetailPayload,
  ProjectDetailLocationState,
} from '@entities/project'

export {
  saveProjectDetailPreview,
  loadProjectDetailPreview,
  clearProjectDetailPreview,
} from './lib/projectDetailPreviewSession'

export { navigateToProjectDetail } from './lib/navigateToProjectDetail'

export { submitPublishProject, validatePublishProjectSubmit, ProjectsApiError } from './services/submitPublishProject'

export { evaluateProject, clearKeyPairCache } from './services/evaluateProjectService'
export type { EvaluateProjectInput, EvaluateProjectOutput } from './services/evaluateProjectService'

export type {
  PublicKeyResponse,
  EvaluateProjectRequest,
  EvaluateProjectResponse,
} from './api/evaluateProjectApi'
