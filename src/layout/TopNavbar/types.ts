// 01）顶部导航组件参数类型（TopNavbarProps）
export interface TopNavbarProps {
  navItems?: string[]
}

// 02）导航路由映射项类型（NavRouteItem）
export interface NavRouteItem {
  label: string
  path: string
}
