// 01）TopNavbar 右侧操作区（TopNavbarHeaderActions）
import { ChevronDown, ListTodo, MessageCircle, Send, Ticket } from 'lucide-react'
import type { TopNavbarWidgetModel } from '../hooks/useTopNavbarWidget'
import { TopNavbarUserProfileMenu } from './top-navbar-user-profile-menu'

// 02）组件 Props（TopNavbarHeaderActionsProps）
export interface TopNavbarHeaderActionsProps {
  model: TopNavbarWidgetModel
}

/**
 * 函数名：TopNavbarHeaderActions
 * 功能：渲染 TopNavbar 右侧搜索、登录、主题、通知与发布入口。
 * 输入：
 * - model：useTopNavbarWidget 返回值
 * 输出：
 * - 返回值：React 节点
 */
export function TopNavbarHeaderActions({ model }: TopNavbarHeaderActionsProps) {
  const {
    theme,
    themeLabel,
    toggleTheme,
    isLoggedIn,
    handleAuthEntryClick,
    handleNotifyClick,
    handleLogout,
    showSchoolCodeEntry,
    publishMenuRef,
    isCodeMenuOpen,
    setIsCodeMenuOpen,
    setIsPublishMenuOpen,
    handleSelectPublishType,
    isPublishMenuOpen,
    handlePublishEntryClick,
    publishMenuOptions,
  } = model

  return (
    <div className="header-actions">
      <label className="top-header-search" htmlFor="top-header-search-input">
        <span className="top-header-search__icon">🔍</span>
        <input
          id="top-header-search-input"
          type="text"
          placeholder="搜索项目名称 / 企业名称 / 技术关键词"
          aria-label="搜索项目"
        />
      </label>

      {isLoggedIn ? (
        <TopNavbarUserProfileMenu onLogout={handleLogout} />
      ) : (
        <button className="login-entry-button" type="button" onClick={handleAuthEntryClick}>
          登录 / 注册
        </button>
      )}

      <button
        className={`theme-button theme-button--${theme}`}
        type="button"
        onClick={toggleTheme}
        aria-label={themeLabel}
        title={themeLabel}
      >
        <span className="theme-button__glow" />
        <span className="theme-button__icon">{theme === 'light' ? '☀️' : '🌙'}</span>
      </button>

      <button
        className="notify-button"
        type="button"
        aria-label="消息通知"
        onClick={handleNotifyClick}
        title="打开即时通讯"
      >
        <span className="notify-button__glow" />
        <span className="notify-button__icon">
          <MessageCircle size={18} strokeWidth={2.2} />
        </span>
      </button>

      {showSchoolCodeEntry ? (
        <div className="publish-entry" ref={publishMenuRef}>
          <button
            type="button"
            className={`publish-entry-button ${isCodeMenuOpen ? 'publish-entry-button--open' : ''}`.trim()}
            aria-label="学校认证码"
            aria-haspopup="menu"
            aria-expanded={isCodeMenuOpen}
            onClick={() => {
              setIsCodeMenuOpen((previous) => !previous)
              setIsPublishMenuOpen(false)
            }}
          >
            <Ticket size={16} strokeWidth={2.2} />
            <span>学校认证码</span>
            <ChevronDown
              size={14}
              strokeWidth={2.2}
              className={`publish-entry-button__chevron ${isCodeMenuOpen ? 'publish-entry-button__chevron--open' : ''}`.trim()}
            />
          </button>
          {isCodeMenuOpen ? (
            <div className="publish-entry-menu" role="menu" aria-label="认证码选项">
              <button
                type="button"
                role="menuitem"
                className="publish-entry-menu__item"
                onClick={() => handleSelectPublishType('code-generate')}
              >
                <span className="publish-entry-menu__item-icon">
                  <Ticket size={16} />
                </span>
                <span className="publish-entry-menu__item-text">
                  <span className="publish-entry-menu__item-label">生成认证码</span>
                  <span className="publish-entry-menu__item-desc">创建新的母码</span>
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="publish-entry-menu__item"
                onClick={() => handleSelectPublishType('code-manage')}
              >
                <span className="publish-entry-menu__item-icon">
                  <ListTodo size={16} />
                </span>
                <span className="publish-entry-menu__item-text">
                  <span className="publish-entry-menu__item-label">认证码管理</span>
                  <span className="publish-entry-menu__item-desc">查看、停用、延期认证码</span>
                </span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!showSchoolCodeEntry ? (
        <div className="publish-entry" ref={publishMenuRef}>
          <button
            type="button"
            className={`publish-entry-button ${isPublishMenuOpen ? 'publish-entry-button--open' : ''}`.trim()}
            aria-label="发布内容"
            aria-haspopup="menu"
            aria-expanded={isPublishMenuOpen}
            onClick={handlePublishEntryClick}
          >
            <Send size={16} strokeWidth={2.2} />
            <span>发布</span>
            <ChevronDown
              size={14}
              strokeWidth={2.2}
              className={`publish-entry-button__chevron ${isPublishMenuOpen ? 'publish-entry-button__chevron--open' : ''}`.trim()}
            />
          </button>
          {isPublishMenuOpen ? (
            <div className="publish-entry-menu" role="menu" aria-label="选择发布类型">
              {publishMenuOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  role="menuitem"
                  className="publish-entry-menu__item"
                  onClick={() => handleSelectPublishType(option.type)}
                >
                  <span className="publish-entry-menu__item-icon">
                    <option.icon size={16} />
                  </span>
                  <span className="publish-entry-menu__item-text">
                    <span className="publish-entry-menu__item-label">{option.label}</span>
                    <span className="publish-entry-menu__item-desc">{option.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
