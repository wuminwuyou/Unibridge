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
} from './components/ProjectFormFields'

export { ChannelPicker } from './components/ChannelPicker'
export type { ChannelPickerProps } from './components/ChannelPicker'

export { SkillTagsEditor } from './components/SkillTagsEditor'
export type { SkillTagsEditorProps } from './components/SkillTagsEditor'

export { DescriptionEditor } from './components/DescriptionEditor'
export type { DescriptionEditorProps } from './components/DescriptionEditor'

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
