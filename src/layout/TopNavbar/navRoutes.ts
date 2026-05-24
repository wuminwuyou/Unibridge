import type { NavRouteItem } from './types'

// 01）已接入导航路由表（navRouteItems）
export const navRouteItems: NavRouteItem[] = [
  { label: '大厅', path: '/' },
  { label: '项目', path: '/project' },
  { label: '共创', path: '/co-create' },
  { label: '笔记', path: '/note' },
]

// 02）主导航文案列表（mainNavItemLabels）
export const mainNavItemLabels: string[] = navRouteItems.map((routeItem) => routeItem.label)

// 03）路径激活项解析（resolveActiveNavByPathname）
/**
 * 函数名：resolveActiveNavByPathname
 * 功能：根据当前页面路径解析应高亮的导航项，避免固定高亮造成误导。
 * 实现方法：
 * - 优先在已接入路由表中按 path 精确匹配 label
 * - 未精确命中时按路径前缀匹配各频道（项目/共创/笔记详情与发布页等）
 * - 路径未命中时返回空字符串表示不高亮主导航
 * 输入：
 * - pathname：当前 URL 路径
 * 输出：
 * - 返回值：string，当前应高亮的导航名称（空串表示不高亮）
 * - 副作用：无
 */
export function resolveActiveNavByPathname(pathname: string): string {
  const exactMatch = navRouteItems.find((routeItem) => routeItem.path === pathname)
  if (exactMatch) {
    return exactMatch.label
  }

  if (pathname.startsWith('/project')) {
    return '项目'
  }

  if (pathname.startsWith('/co-create')) {
    return '共创'
  }

  if (pathname.startsWith('/note') || pathname.startsWith('/publish/note')) {
    return '笔记'
  }

  return ''
}
