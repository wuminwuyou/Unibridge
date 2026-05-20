import type { ThemeMode } from '../../../../contexts/ThemeContext'
import UserProfileMenu from './UserProfileMenu'

// 01）右侧操作区参数（HeaderActionsProps）
interface HeaderActionsProps {
  theme: ThemeMode
  isAuthenticated: boolean
  onToggleTheme: () => void
  onAuthEntryClick: () => void
  onNotifyClick: () => void
}

// 02）右侧操作区视图（HeaderActions）
/**
 * 函数名：HeaderActions
 * 功能：渲染顶部导航右侧的主题切换、消息通知与登录/已登录入口区。
 * 实现方法：
 * - 主题按钮根据当前 theme 切换图标与提示文案
 * - 消息通知按钮预留入口
 * - 未登录：渲染「登录 / 注册」按钮，点击触发 onAuthEntryClick 打开登录弹窗
 * - 已登录：渲染 UserProfileMenu（头像 + 悬浮功能面板）
 * 输入：
 * - theme：当前主题模式
 * - isAuthenticated：是否已登录
 * - onToggleTheme：主题切换回调
 * - onAuthEntryClick：未登录态下的入口点击回调
 * 输出：
 * - 返回值：JSX.Element，右侧操作区结构
 * - 副作用：无（事件由父级处理器承担）
 */
function HeaderActions({ theme, isAuthenticated, onToggleTheme, onAuthEntryClick, onNotifyClick }: HeaderActionsProps) {
  const themeButtonLabel = `切换到${theme === 'light' ? '深色' : '浅色'}主题`

  return (
    <div className="header-actions">
      {/* 03）顶部导航搜索区（top-header-search） */}
      <label className="top-header-search" htmlFor="top-header-search-input">
        <span className="top-header-search__icon" aria-hidden="true">
          🔍
        </span>
        <input
          id="top-header-search-input"
          type="text"
          placeholder="搜索项目名称 / 企业名称 / 技术关键词"
          aria-label="搜索项目"
        />
      </label>

      <button
        className={`theme-button theme-button--${theme}`}
        type="button"
        onClick={onToggleTheme}
        aria-label={themeButtonLabel}
        title={themeButtonLabel}
      >
        <span className="theme-button__glow" aria-hidden="true" />
        <span className="theme-button__icon" aria-hidden="true">
          {theme === 'light' ? '☀️' : '🌙'}
        </span>
      </button>
      <button className="notify-button" type="button" aria-label="消息通知" onClick={onNotifyClick} title="打开即时通讯">
        <span className="notify-button__glow" aria-hidden="true" />
        <span className="notify-button__icon" aria-hidden="true">
          🔔
        </span>
      </button>

      {isAuthenticated ? (
        <UserProfileMenu />
      ) : (
        <button className="login-entry-button" type="button" onClick={onAuthEntryClick}>
          登录 / 注册
        </button>
      )}
    </div>
  )
}

export default HeaderActions
