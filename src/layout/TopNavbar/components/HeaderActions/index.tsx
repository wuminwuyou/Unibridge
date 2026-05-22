import type { ThemeMode } from '../../../../contexts/ThemeContext'
import { ChevronDown, Send } from 'lucide-react'
import UserProfileMenu from '../UserProfileMenu'
import { usePublishEntryMenu } from './usePublishEntryMenu'
import './style.css'

// 01）右侧操作区参数（HeaderActionsProps）
interface HeaderActionsProps {
  theme: ThemeMode
  isAuthenticated: boolean
  onToggleTheme: () => void
  onAuthEntryClick: () => void
  onNotifyClick: () => void
  onLogout: () => void
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
 * - 发布按钮通过 usePublishEntryMenu 展示向下选项（项目 / 笔记）
 * 输入：
 * - theme：当前主题模式
 * - isAuthenticated：是否已登录
 * - onToggleTheme：主题切换回调
 * - onAuthEntryClick：未登录态下的入口点击回调
 * 输出：
 * - 返回值：JSX.Element，右侧操作区结构
 * - 副作用：无（事件由 Hook 与父级处理器承担）
 */
function HeaderActions({ theme, isAuthenticated, onToggleTheme, onAuthEntryClick, onNotifyClick, onLogout }: HeaderActionsProps) {
  const themeButtonLabel = `切换到${theme === 'light' ? '深色' : '浅色'}主题`
  const publishMenu = usePublishEntryMenu({
    isAuthenticated,
    onRequireAuth: onAuthEntryClick,
  })

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

      {isAuthenticated ? (
        <UserProfileMenu onLogout={onLogout} />
      ) : (
        <button className="login-entry-button" type="button" onClick={onAuthEntryClick}>
          登录 / 注册
        </button>
      )}

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

      <div className="publish-entry" ref={publishMenu.menuRef}>
        <button
          type="button"
          className={`publish-entry-button ${publishMenu.isMenuOpen ? 'publish-entry-button--open' : ''}`}
          aria-label="发布内容"
          aria-haspopup="menu"
          aria-expanded={publishMenu.isMenuOpen}
          onClick={publishMenu.togglePublishMenu}
        >
          <Send size={16} strokeWidth={2.2} aria-hidden="true" />
          <span>发布</span>
          <ChevronDown
            size={14}
            strokeWidth={2.2}
            aria-hidden="true"
            className={`publish-entry-button__chevron ${publishMenu.isMenuOpen ? 'publish-entry-button__chevron--open' : ''}`}
          />
        </button>

        {publishMenu.isMenuOpen ? (
          <div className="publish-entry-menu" role="menu" aria-label="选择发布类型">
            {publishMenu.menuOptions.map((option) => {
              const OptionIcon = option.icon

              return (
                <button
                  key={option.type}
                  type="button"
                  role="menuitem"
                  className="publish-entry-menu__item"
                  onClick={() => publishMenu.handleSelectPublishType(option.type)}
                >
                  <span className="publish-entry-menu__item-icon" aria-hidden="true">
                    <OptionIcon size={16} strokeWidth={2.2} />
                  </span>
                  <span className="publish-entry-menu__item-text">
                    <span className="publish-entry-menu__item-label">{option.label}</span>
                    <span className="publish-entry-menu__item-desc">{option.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default HeaderActions
