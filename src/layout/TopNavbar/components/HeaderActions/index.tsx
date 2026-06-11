import { useState } from 'react'
import type { ThemeMode } from '../../../../contexts/ThemeContext'
import { useAuth } from '../../../../contexts/AuthContext'
import { isOrganizationAdminRole, isCounselorRole } from '../../../../auth/organizationSession'
import { ChevronDown, Send, Ticket, ListTodo } from 'lucide-react'
import UserProfileMenu from '../UserProfileMenu'
import { usePublishEntryMenu } from './usePublishEntryMenu'
import { SchoolVerificationCodeModal } from './SchoolVerificationCodeModal'
import { VerificationCodeManageModal } from './VerificationCodeManageModal'
import { SubCodeGenerateModal } from './SubCodeGenerateModal'

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

// 02）判断是否为学校类型主体（isSchoolEntity）
/**
 * 函数名：isSchoolEntity
 * 功能：根据 entity_code 长度判断当前主体是否为学校类型（5 位数字编码）。
 * 实现方法：
 * - 学校 entity_code 为 5 位数字（如 10598），企业统一社会信用代码为 18 位
 * - 仅当 entity_code 存在且长度为 5 时视为学校
 * 输入：
 * - entityCode：主体编码，可选
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
function isSchoolEntity(entityCode?: string): boolean {
  return typeof entityCode === 'string' && entityCode.trim().length === 5
}

// 03）右侧操作区视图（HeaderActions）
/**
 * 函数名：HeaderActions
 * 功能：渲染顶部导航右侧的主题切换、消息通知与登录/已登录入口区。
 * 实现方法：
 * - 主题按钮根据当前 theme 切换图标与提示文案
 * - 消息通知按钮预留入口
 * - 未登录：渲染「登录 / 注册」按钮，点击触发 onAuthEntryClick 打开登录弹窗
 * - 已登录：渲染 UserProfileMenu（头像 + 悬浮功能面板）
 * - 发布按钮通过 usePublishEntryMenu 展示向下选项（项目 / 笔记），辅导员额外包含认证码入口
 * - 学校组织管理员显示独立的「学校认证码」入口按钮
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
  const { userProfile } = useAuth()
  const isOrgAdmin = isOrganizationAdminRole(userProfile?.userRole)
  const isCounselor = isCounselorRole(userProfile?.userRole)
  const isSchool = isSchoolEntity(userProfile?.entityCode)
  // 学校认证码独立入口：仅组织管理员可见（学校主体下）
  const showSchoolCodeEntry = isOrgAdmin && isSchool
  // 辅导员在「发布」菜单中追加认证码入口（辅导员天然属于学校主体，依赖 entityCode 不可靠因为登录接口不返回）
  const showCodeEntryInPublish = isCounselor
  const [isCodeModalOpen, setCodeModalOpen] = useState(false)
  const [isCodeManageModalOpen, setCodeManageModalOpen] = useState(false)
  const [isCodeMenuOpen, setCodeMenuOpen] = useState(false)
  const themeButtonLabel = `切换到${theme === 'light' ? '深色' : '浅色'}主题`
  const publishMenu = usePublishEntryMenu({
    isAuthenticated,
    userRole: userProfile?.userRole,
    showCodeEntry: showCodeEntryInPublish,
    onOpenCodeGenerate: () => setCodeModalOpen(true),
    onOpenCodeManage: () => setCodeManageModalOpen(true),
    onRequireAuth: onAuthEntryClick,
  })

  return (
    <div className="header-actions">
      {/* 04）顶部导航搜索区（top-header-search） */}
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

      {showSchoolCodeEntry ? (
        <div className="publish-entry">
          <button type="button" className={`publish-entry-button ${isCodeMenuOpen ? 'publish-entry-button--open' : ''}`}
            aria-label="学校认证码" aria-haspopup="menu" aria-expanded={isCodeMenuOpen}
            onClick={() => setCodeMenuOpen(prev => !prev)}>
            <Ticket size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>学校认证码</span>
            <ChevronDown size={14} strokeWidth={2.2} aria-hidden="true"
              className={`publish-entry-button__chevron ${isCodeMenuOpen ? 'publish-entry-button__chevron--open' : ''}`} />
          </button>
          {isCodeMenuOpen ? (
            <div className="publish-entry-menu" role="menu" aria-label="认证码选项">
              <button type="button" role="menuitem" className="publish-entry-menu__item"
                onClick={() => { setCodeMenuOpen(false); setCodeModalOpen(true) }}>
                <span className="publish-entry-menu__item-icon" aria-hidden="true"><Ticket size={16} strokeWidth={2.2} /></span>
                <span className="publish-entry-menu__item-text"><span className="publish-entry-menu__item-label">生成认证码</span><span className="publish-entry-menu__item-desc">创建新的母码</span></span>
              </button>
              <button type="button" role="menuitem" className="publish-entry-menu__item"
                onClick={() => { setCodeMenuOpen(false); setCodeManageModalOpen(true) }}>
                <span className="publish-entry-menu__item-icon" aria-hidden="true"><ListTodo size={16} strokeWidth={2.2} /></span>
                <span className="publish-entry-menu__item-text"><span className="publish-entry-menu__item-label">认证码管理</span><span className="publish-entry-menu__item-desc">查看、停用、延期认证码</span></span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!showSchoolCodeEntry ? (
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
      ) : null}

      {isCounselor ? (
        <SubCodeGenerateModal open={isCodeModalOpen} onClose={() => setCodeModalOpen(false)} />
      ) : (
        <SchoolVerificationCodeModal open={isCodeModalOpen} onClose={() => setCodeModalOpen(false)} />
      )}
      <VerificationCodeManageModal
        open={isCodeManageModalOpen}
        onClose={() => setCodeManageModalOpen(false)}
        counselorMode={isCounselor}
      />
    </div>
  )
}

export default HeaderActions
