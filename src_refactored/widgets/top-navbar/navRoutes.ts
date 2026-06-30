// 01）主导航路由配置（navRoutes）
import { PROJECTS_CAMPUS_PATH, PROJECTS_COMMERCIAL_PATH } from '@shared/lib/projectRoutes'
import { NOTES_LIST_PATH } from '@shared/lib/noteRoutes'

export interface NavRouteItem { label: string; path: string }

export const navRouteItems: NavRouteItem[] = [
  { label: '大厅', path: '/' },
  { label: '项目', path: PROJECTS_COMMERCIAL_PATH },
  { label: '校园', path: PROJECTS_CAMPUS_PATH },
  { label: '笔记', path: NOTES_LIST_PATH },
]

export const mainNavItemLabels: string[] = navRouteItems.map(r => r.label)

/**
 * 函数名：resolveActiveNavByPathname
 * 功能：根据当前 pathname 解析主导航栏应高亮的菜单项标签。
 * 实现方法：
 * - 在 navRouteItems 中做路径完全匹配
 * - 兼容旧笔记路径在重定向前短暂高亮
 * 输入：
 * - pathname：当前路由路径
 * 输出：
 * - 返回值：匹配到的导航标签，无匹配时返回空字符串
 * - 副作用：无
 */
export function resolveActiveNavByPathname(pathname: string): string {
  const exact = navRouteItems.find(r => r.path === pathname)
  if (exact) return exact.label
  // 旧路径重定向前短暂命中
  if (pathname === '/note' || pathname.startsWith('/note/') || pathname === '/publish/note' || pathname === '/note-detail') {
    return '笔记'
  }
  return ''
}
