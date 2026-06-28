// 01）主导航路由配置（navRoutes）
export interface NavRouteItem { label: string; path: string }

export const navRouteItems: NavRouteItem[] = [
  { label: '大厅', path: '/' },
  { label: '项目', path: '/project' },
  { label: '共创', path: '/co-create' },
  { label: '笔记', path: '/note' },
]

export const mainNavItemLabels: string[] = navRouteItems.map(r => r.label)

export function resolveActiveNavByPathname(pathname: string): string {
  const exact = navRouteItems.find(r => r.path === pathname)
  if (exact) return exact.label
  if (pathname.startsWith('/project')) return '项目'
  if (pathname.startsWith('/co-create')) return '共创'
  if (pathname.startsWith('/note') || pathname.startsWith('/publish/note')) return '笔记'
  return ''
}
