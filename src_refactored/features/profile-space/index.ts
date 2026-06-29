// 01）profile-space Feature 公开接口
export {
  resolveProfileSpaceVariant,
  type ProfileSpaceVariant,
  type ProfileSpaceShellLoadState,
} from './lib/profileSpaceVariant'

// 02）路由公开接口（routing）
export {
  buildPersonalSpacePath,
  extractPersonalProfileUidFromSearch,
  extractPersonalTabRouteSegment,
  isSupportedPersonalTabRouteSegment,
  personalTabByRouteSegment,
  personalTabRouteSegmentByTab,
  personalViewTabs,
  resolvePersonalTabFromLegacySearch,
  resolvePersonalTabFromPathname,
  supportedPersonalViewTabs,
  type PersonalProfileTab,
} from './lib/routing/personalTabRouting'

export {
  buildTeamMembersManagePath,
  buildTeamSpacePath,
  extractTeamSubRouteSegment,
  extractTeamTabRouteSegment,
  extractTeamUidFromSearch,
  isSupportedTeamTabRouteSegment,
  isTeamMembersManagePathname,
  isTeamSpacePathname,
  resolveLegacyTeamSpaceRedirect,
  resolveTeamTabFromPathname,
  teamTabByRouteSegment,
  teamTabRouteSegmentByTab,
  teamViewTabs,
  type TeamProfileTab,
} from './lib/routing/teamTabRouting'

export {
  buildOrganizationSpacePath,
  extractEntityCodeFromSearch,
  extractOrganizationTabRouteSegment,
  isOrganizationSpacePathname,
  isSupportedOrganizationTabRouteSegment,
  organizationTabByRouteSegment,
  organizationTabRouteSegmentByTab,
  organizationViewTabs,
  resolveLegacyOrganizationSpaceRedirect,
  resolveOrganizationTabFromPathname,
  type OrganizationProfileTab,
} from './lib/routing/organizationTabRouting'

// 03）常量公开接口（constants）
export {
  PROFILE_SPACE_MEMBER_CARD_HEIGHT_PX,
  PROFILE_SPACE_MEMBERS_PREVIEW_MAX_ROWS,
  PROFILE_SPACE_ORG_HOME_MEMBER_PREVIEW_LIMIT,
  PROFILE_SPACE_ORG_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_ORG_HOME_PROJECT_PREVIEW_LIMIT,
  PROFILE_SPACE_ORG_HOME_TEAM_PREVIEW_LIMIT,
  PROFILE_SPACE_PERSONAL_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_PERSONAL_HOME_PROJECT_PREVIEW_LIMIT,
  PROFILE_SPACE_SIDEBAR_COLLAPSE_DURATION_MS,
  PROFILE_SPACE_TEAM_HOME_ACHIEVEMENT_PREVIEW_LIMIT,
  PROFILE_SPACE_TEAM_HOME_NOTE_PREVIEW_LIMIT,
  PROFILE_SPACE_TEAM_HOME_PROJECT_PREVIEW_LIMIT,
} from './constants/profileSpaceTabConstants'

// 04）Tab 内容组件
export { PersonalHomeTabContent } from './components/HomeTab/PersonalHomeTabContent'
export { TeamHomeTabContent } from './components/HomeTab/TeamHomeTabContent'
export { OrganizationHomeTabContent } from './components/HomeTab/OrganizationHomeTabContent'
export { PersonalNotesTabContent } from './components/NotesTab/PersonalNotesTabContent'
