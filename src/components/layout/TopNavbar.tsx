import { useTheme } from '../../contexts/ThemeContext'
import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import AuthModal from '../AuthModal'
import type { AuthStatus, AuthUserRole } from '../AuthModal'

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
  const navigate = useNavigate()
  const activeNavItem = resolveActiveNavByPathname(pathname)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  // 06）打开登录弹窗处理函数（handleOpenAuthModal）
  const handleOpenAuthModal = (): void => {
    setIsAuthModalOpen(true)
  }

  // 07）关闭登录弹窗处理函数（handleCloseAuthModal）
  const handleCloseAuthModal = (): void => {
    setIsAuthModalOpen(false)
  }

  // 08）登录成功处理函数（handleAuthSuccess）
  const handleAuthSuccess = (_userRole: AuthUserRole, _authStatus: AuthStatus): void => {
    setIsAuthenticated(true)
    setIsAuthModalOpen(false)
  }

  // 09）右上角认证入口点击处理函数（handleAuthEntryClick）
  /**
   * 函数名：handleAuthEntryClick
   * 功能：处理未登录与已登录两种状态下的入口点击逻辑。
   * 实现方法：
   * - 未登录时打开登录弹窗
   * - 已登录时跳转到个人空间页面
   * - 若当前已在个人空间，避免重复跳转
   * 输入：
   * - 无
   * 输出：
   * - 返回值：void
   * - 副作用：更新弹窗状态或触发路由跳转
   */
  const handleAuthEntryClick = (): void => {
    if (!isAuthenticated) {
      handleOpenAuthModal()
      return
    }

    if (pathname !== '/profile') {
      navigate('/profile')
    }
  }

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
          <button
            className={`login-entry-button ${isAuthenticated ? 'login-entry-button--authenticated' : ''}`}
            type="button"
            onClick={handleAuthEntryClick}
          >
            {isAuthenticated ? '个人空间' : '登录 / 注册'}
          </button>
        </div>
      </div>

      <AuthModal
        open={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        onSuccess={handleAuthSuccess}
      />
    </header>
  )
}

export default TopNavbar
