// 01）个人空间顶部导航数据（profileSpaceNavItems）
export { mainNavItemLabels as profileSpaceNavItems } from '../../layout/TopNavbar/navRoutes'

// 02）个人空间 Tab 列表（profileTabs）
export const profileTabs = ['主页', '项目', '笔记', '收藏', '设置'] as const

// 03）支持的路由 Tab 映射（supportedProfileTabs）
export const supportedProfileTabs: ReadonlySet<(typeof profileTabs)[number]> = new Set(profileTabs)

// 04）右侧栏折叠动画时长（SIDEBAR_COLLAPSE_DURATION_MS）
export const SIDEBAR_COLLAPSE_DURATION_MS = 280
