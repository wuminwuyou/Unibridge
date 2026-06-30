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

export function resolveActiveNavByPathname(pathname: string): string {
  const exact = navRouteItems.find(r => r.path === pathname)
  if (exact) return exact.label
  if (pathname === PROJECTS_CAMPUS_PATH) return '校园'
  if (pathname.startsWith('/projects')) return '项目'
  if (pathname.startsWith('/notes')) return '笔记'
  // 旧路径重定向前短暂命中
  if (pathname === '/note' || pathname.startsWith('/note/') || pathname === '/publish/note' || pathname === '/note-detail') {
    return '笔记'
  }
  return ''
}
