// 01）TopNavbar 外部控制事件名（TOP_NAVBAR_REQUEST_HIDE_EVENT）
export const TOP_NAVBAR_REQUEST_HIDE_EVENT = 'top-navbar:request-hide'

/** 目录跳转后抑制「向上滚动显示导航栏」的时长（ms），用于 scrollend 不可用时的兜底 */
export const TOP_NAVBAR_FORCE_HIDE_FALLBACK_MS = 900

// 02）请求隐藏 TopNavbar（requestTopNavbarHide）
/**
 * 函数名：requestTopNavbarHide
 * 功能：通知 TopNavbar 在笔记阅读/编辑页立即进入滚动隐藏态（含向上跳转场景）。
 * 实现方法：
 * - 派发 TOP_NAVBAR_REQUEST_HIDE_EVENT，由 useTopNavbarScrollHide 同步处理
 * 输入：无
 * 输出：
 * - 返回值：void
 * - 副作用：可能更新 html.navbar-hidden 与导航栏 transform
 */
export function requestTopNavbarHide(): void {
  window.dispatchEvent(new CustomEvent(TOP_NAVBAR_REQUEST_HIDE_EVENT))
}
