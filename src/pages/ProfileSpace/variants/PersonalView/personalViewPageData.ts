// 01）个人用户空间顶部导航数据（profileSpaceNavItems）
export { mainNavItemLabels as profileSpaceNavItems } from '../../../../layout/TopNavbar/navRoutes'

// 02）个人用户空间 Tab 列表（personalViewTabs）
export const personalViewTabs = ['主页', '项目', '笔记', '收藏', '设置'] as const

/** @deprecated 使用 personalViewTabs */
export const profileTabs = personalViewTabs

// 03）支持的路由 Tab 映射（supportedPersonalViewTabs）
export const supportedPersonalViewTabs: ReadonlySet<(typeof personalViewTabs)[number]> = new Set(personalViewTabs)

/** @deprecated 使用 supportedPersonalViewTabs */
export const supportedProfileTabs = supportedPersonalViewTabs

// 04）右侧栏折叠动画时长（SIDEBAR_COLLAPSE_DURATION_MS）
export const SIDEBAR_COLLAPSE_DURATION_MS = 280

// 05）主页 Tab 预览条数上限（PROFILE_HOME_*_PREVIEW_LIMIT）
export {
  PROFILE_SPACE_PERSONAL_HOME_PROJECT_PREVIEW_LIMIT as PROFILE_HOME_PROJECT_PREVIEW_LIMIT,
  PROFILE_SPACE_PERSONAL_HOME_NOTE_PREVIEW_LIMIT as PROFILE_HOME_NOTE_PREVIEW_LIMIT,
} from '../../profileSpaceTabConstants'
