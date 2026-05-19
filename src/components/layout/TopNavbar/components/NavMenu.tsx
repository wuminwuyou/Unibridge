import { NavLink } from 'react-router-dom'
import { navRouteItems } from '../navRoutes'

// 01）主导航视图参数（NavMenuProps）
interface NavMenuProps {
  navItems: string[]
  activeNavItem: string
}

// 02）主导航视图（NavMenu）
/**
 * 函数名：NavMenu
 * 功能：根据传入的导航文案列表渲染顶部主导航。
 * 实现方法：
 * - 在已接入路由表中按 label 查找 path
 * - 命中路由使用 NavLink 提供真实跳转
 * - 未命中路由保留 button 形态，便于后续接入
 * - 当前路径对应项追加 active 高亮样式
 * 输入：
 * - navItems：导航文案数组
 * - activeNavItem：当前应高亮的导航文案
 * 输出：
 * - 返回值：JSX.Element，主导航结构
 * - 副作用：无
 */
function NavMenu({ navItems, activeNavItem }: NavMenuProps) {
  return (
    <nav className="top-nav" aria-label="主导航">
      {navItems.map((item) => {
        const navRoute = navRouteItems.find((routeItem) => routeItem.label === item)
        const className = `top-nav__item ${item === activeNavItem ? 'active' : ''}`

        if (navRoute) {
          return (
            <NavLink key={item} className={className} to={navRoute.path}>
              {item}
            </NavLink>
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

export default NavMenu
