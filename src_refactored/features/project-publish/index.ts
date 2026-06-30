// 01）发布项目 Feature 公开接口
export type { PublishProjectFormDraft, CampusRecruitOption, PublishChannelOption, ProjectPublishAction } from './model/types'

export {
  campusRecruitOptions,
  publishChannelOptions,
  publishLevelOptions,
  suggestedSkillTags,
  publishChecklistItems,
  resolvePublishPreviewBadge,
  resolveProjectChannelLabel,
  createDefaultPublishProjectDraft,
} from './constants/publishOptions'

export {
  ProjectTitleField,
  ProjectSummaryField,
  ProjectAmountField,
  ProjectLevelField,
  ProjectDurationField,
  ProjectTeamSizeField,
  ProjectDeadlineField,
} from './components/fields'

export type {
  ProjectDurationFieldProps,
  ProjectTeamSizeFieldProps,
  ProjectDeadlineFieldProps,
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
export type {
  ProjectDetailPublishStatus,
  ProjectDetailPayload,
  ProjectDetailLocationState,
} from './lib/buildProjectDetailPayload'

export {
  saveProjectDetailPreview,
  loadProjectDetailPreview,
  clearProjectDetailPreview,
} from './lib/projectDetailPreviewSession'

export { navigateToProjectDetail } from './lib/navigateToProjectDetail'

export { submitPublishProject, validatePublishProjectSubmit, ProjectsApiError } from './services/submitPublishProject'
