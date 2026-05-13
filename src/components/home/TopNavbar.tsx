import type { ThemeMode } from './types'

// 01）顶部导航组件参数类型（TopNavbarProps）
interface TopNavbarProps {
  navItems: string[]
  activeNavItem: string
  theme: ThemeMode
  onToggleTheme: () => void
}

// 02）顶部导航栏组件（TopNavbar）
/**
 * 函数名：TopNavbar
 * 功能：渲染首页顶部导航栏，包含品牌区、导航菜单与右侧操作按钮组。
 * 实现方法：
 * - 根据 navItems 循环渲染主导航项并高亮当前激活项
 * - 在右侧动作区提供主题切换、通知与用户信息按钮
 * - 根据 theme 动态设置按钮视觉状态与提示文案
 * 输入：
 * - navItems：导航菜单文本数组
 * - activeNavItem：当前激活菜单名称
 * - theme：当前主题模式（light/dark）
 * - onToggleTheme：主题切换回调函数
 * 输出：
 * - 返回值：JSX.Element，顶部导航栏结构
 * - 副作用：点击主题按钮时触发外部状态更新
 */
function TopNavbar({ navItems, activeNavItem, theme, onToggleTheme }: TopNavbarProps) {
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
          {navItems.map((item) => (
            <a key={item} className={`top-nav__item ${item === activeNavItem ? 'active' : ''}`} href="#!">
              {item}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className={`theme-button theme-button--${theme}`}
            type="button"
            onClick={onToggleTheme}
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
          <button className="user-button" type="button">
            <span className="user-avatar" aria-hidden="true">
              张
            </span>
            <span>张同学</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopNavbar
