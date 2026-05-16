import UserProfileMenu from '../home/UserProfileMenu'
import { useTheme } from '../../contexts/ThemeContext'
import { NavLink, useLocation } from 'react-router-dom'

// 01）顶部导航组件参数类型（TopNavbarProps）
interface TopNavbarProps {
  navItems: string[]
}

// 02）路由与导航映射类型定义（NavRouteItem）
interface NavRouteItem {
  label: string
  path: string
}

// 03）已接入导航路由表（navRouteItems）
const navRouteItems: NavRouteItem[] = [
  { label: '首页', path: '/' },
  { label: '企业实战', path: '/enterprise' },
  { label: '高校招募', path: '/campus-recruit' },
  { label: '经验分享', path: '/experience-share' },
]

// 04）路径激活项解析函数（resolveActiveNavByPathname）
/**
 * 函数名：resolveActiveNavByPathname
 * 功能：根据当前页面路径解析应高亮的导航项，避免固定高亮造成误导。
 * 实现方法：
 * - 当路径为首页时返回“首页”
 * - 当路径为企业实战时返回“企业实战”
 * - 当路径为高校招募时返回“高校招募”
 * 输入：
 * - pathname：当前 URL 路径
 * 输出：
 * - 返回值：string，当前应高亮的导航名称，空字符串表示不高亮
 * - 副作用：无
 */
function resolveActiveNavByPathname(pathname: string): string {
  if (pathname === '/') {
    return '首页'
  }

  if (pathname === '/enterprise') {
    return '企业实战'
  }

  if (pathname === '/campus-recruit') {
    return '高校招募'
  }

  if (pathname === '/experience-share') {
    return '经验分享'
  }

  return ''
}

// 05）顶部导航栏组件（TopNavbar）
/**
 * 函数名：TopNavbar
 * 功能：渲染全局顶部导航栏，供首页、频道页、个人空间等页面统一复用。
 * 实现方法：
 * - 根据当前路由动态计算导航高亮状态
 * - 已接入项使用 NavLink 提供真实页面跳转
 * - 未接入项保留按钮形态，便于后续接路由
 * - 右侧集成主题切换、通知入口与用户头像菜单
 * 输入：
 * - navItems：导航菜单文本数组
 * 输出：
 * - 返回值：JSX.Element，顶部导航栏结构
 * - 副作用：点击主题按钮会触发全局主题切换
 */
function TopNavbar({ navItems }: TopNavbarProps) {
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const activeNavItem = resolveActiveNavByPathname(pathname)

  return (
    <header className="top-header">
      <div className="top-header__inner">
        <div className="brand-group">
          <div className="brand-logo" aria-hidden="true">
            U
          </div>
          <div className="brand-text">
            <strong>众创桥</strong>
            <span>连接企业与未来人才</span>
          </div>
        </div>

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

        <div className="header-actions">
          <button
            className={`theme-button theme-button--${theme}`}
            type="button"
            onClick={toggleTheme}
            aria-label={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
            title={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
          >
            <span className="theme-button__glow" aria-hidden="true" />
            <span className="theme-button__icon" aria-hidden="true">
              {theme === 'light' ? '☀️' : '🌙'}
            </span>
          </button>
          <button className="notify-button" type="button" aria-label="消息通知">
            <span aria-hidden="true">🔔</span>
          </button>
          <UserProfileMenu />
        </div>
      </div>
    </header>
  )
}

export default TopNavbar
