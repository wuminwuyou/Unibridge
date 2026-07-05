// 01）TopNavbar 主导航（TopNavbarNavMenu）
import { Link } from 'react-router-dom'
import { navRouteItems } from '../navRoutes'

// 02）组件 Props（TopNavbarNavMenuProps）
export interface TopNavbarNavMenuProps {
  navItems: string[]
  activeNavItem: string
}

/**
 * 函数名：TopNavbarNavMenu
 * 功能：渲染顶部主导航 tabs，并根据当前路由高亮。
 * 输入：
 * - navItems：导航标签列表
 * - activeNavItem：当前高亮标签
 * 输出：
 * - 返回值：React 节点
 */
export function TopNavbarNavMenu({ navItems, activeNavItem }: TopNavbarNavMenuProps) {
  return (
    <nav className="top-nav" aria-label="主导航">
      {navItems.map((item) => {
        const route = navRouteItems.find((entry) => entry.label === item)
        const className = `top-nav__item ${item === activeNavItem ? 'active' : ''}`.trim()

        if (route) {
          return (
            <Link key={item} className={className} to={route.path}>
              {item}
            </Link>
          )
        }

        return (
          <button key={item} className={className} type="button">
            {item}
          </button>
        )
      })}
    </nav>
  )
}
