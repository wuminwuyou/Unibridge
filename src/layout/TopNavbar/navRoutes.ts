import type { NavRouteItem } from './types'

// 01）已接入导航路由表（navRouteItems）
export const navRouteItems: NavRouteItem[] = [
  { label: '首页', path: '/' },
  { label: '企业实战', path: '/enterprise' },
  { label: '高校招募', path: '/campus-recruit' },
  { label: '经验分享', path: '/experience-share' },
]

// 02）路径激活项解析（resolveActiveNavByPathname）
/**
 * 函数名：resolveActiveNavByPathname
 * 功能：根据当前页面路径解析应高亮的导航项，避免固定高亮造成误导。
 * 实现方法：
 * - 在已接入路由表中按 path 反查 label
 * - 路径未命中时返回空字符串表示不高亮主导航
 * 输入：
 * - pathname：当前 URL 路径
 * 输出：
 * - 返回值：string，当前应高亮的导航名称（空串表示不高亮）
 * - 副作用：无
 */
export function resolveActiveNavByPathname(pathname: string): string {
  const matchedRouteItem = navRouteItems.find((routeItem) => routeItem.path === pathname)
  return matchedRouteItem ? matchedRouteItem.label : ''
}
