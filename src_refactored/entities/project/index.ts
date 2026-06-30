// 01）项目实体公开接口（entities/project）

// api
export { createProject, updateProject, getProjectDetail, ProjectsApiError } from './api/projectApi'
export { getProjectFeed, shuffleFeed, sendInteraction, recordView, getHomeFeed } from './api/projectFeedApi'

// model
export type {
  ProjectPublishAction,
  UpsertProjectRequest,
  UpsertProjectResponse,
  ProjectDetailDto,
} from './model/types'
export type {
  ProjectDetailPublishStatus,
  ProjectDetailApiLoadState,
  ProjectDetailPayload,
  ProjectDetailLocationState,
} from './model/projectDetailViewModel'

export { useProjectDetail } from './model/useProjectDetail'
export { useProjectDetailViewReport } from './model/useProjectDetailViewReport'

// lib
export { buildUpsertProjectRequest } from './lib/buildUpsertProjectRequest'
export { mapProjectDetailToPayload } from './lib/mapProjectDetailToPayload'
export { resolveProjectChannelLabel } from './lib/resolveProjectChannelLabel'
export { parseProjectDetailRouteParam } from './lib/parseProjectDetailRouteParam'
export type { ParsedProjectDetailRouteParam } from './lib/parseProjectDetailRouteParam'
export { buildFallbackProjectDetail } from './lib/buildFallbackProjectDetail'

// ui
export { ProjectDetailHero } from './ui/ProjectDetailHero'
export type { ProjectDetailHeroProps } from './ui/ProjectDetailHero'
export { ProjectCooperationCard } from './ui/ProjectCooperationCard'
export type { ProjectCooperationCardProps } from './ui/ProjectCooperationCard'
export { ProjectDetailContentSection } from './ui/ProjectDetailContentSection'
export type { ProjectDetailContentSectionProps } from './ui/ProjectDetailContentSection'
