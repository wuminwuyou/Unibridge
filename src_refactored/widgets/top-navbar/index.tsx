// 01）顶部导航 Widget（top-navbar）
import './style.css'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../../shared/hooks/useAuth'
import { useTheme } from '../../shared/hooks/useTheme'
import { buildDefaultStats, buildPersonalDefaultMenuItems, buildOrganizationDefaultMenuItems, type ProfileMenuChannel } from '../../app/providers/ProfileMenuProvider'
import LevelBadge from '../../shared/ui/LevelBadge'
import UserAvatar from '../../shared/ui/UserAvatar'
import { useUserAvatarData } from '../../shared/hooks/useUserAvatarData'
import { useUserMenuData } from './hooks/useUserMenuData'
import { getUserUid, getMenuCache } from '../../shared/lib/tokenStorage'
import { ChevronDown, Send, Ticket, ListTodo, BookOpenText, FolderKanban, ChevronRight, LogOut, MessageCircle } from 'lucide-react'
import { isOrganizationAdminRole, isCounselorRole } from '../../shared/lib/organizationSession'
import { getAccessToken, getRefreshToken } from '../../shared/lib/tokenStorage'
import { logoutByTokens } from '../../features/auth-process/services/authService'
import { resolveActiveNavByPathname, navRouteItems, mainNavItemLabels } from './navRoutes'
import { createPublishEntryFreshLocationState } from '../../shared/lib/publishEntryNavigation'
import { PROJECTS_CREATE_PATH } from '../../shared/lib/projectRoutes'
import { buildNoteEditorPath } from '../../shared/lib/noteRoutes'
import { clearNoteDetailPreview } from '@features/note-editor'
import { NoteEditorTypeModal, useNoteEditorTypeModal } from '@features/note-editor-entry'
import AuthModal from '../../widgets/auth-modal'

// 02）品牌区视图（BrandGroup）
function BrandGroup() {
  return (
    <div className="brand-group">
      <div className="brand-logo" aria-hidden="true">U</div>
      <div className="brand-text">
        <strong>众创桥</strong>
        <span>连接企业与未来人才</span>
      </div>
    </div>
  )
}

// 03）主导航视图（NavMenu）
function NavMenu({ navItems, activeNavItem }: { navItems: string[]; activeNavItem: string }) {
  return (
    <nav className="top-nav" aria-label="主导航">
      {navItems.map((item) => {
        const route = navRouteItems.find(r => r.label === item)
        const cls = `top-nav__item ${item === activeNavItem ? 'active' : ''}`
        if (route) return <Link key={item} className={cls} to={route.path}>{item}</Link>
        return <button key={item} className={cls} type="button">{item}</button>
      })}
    </nav>
  )
}

// 04）发布入口菜单数据
type PublishEntryType = 'project' | 'note' | 'code-generate' | 'code-manage'
interface PublishMenuOption { type: PublishEntryType; label: string; description: string; path?: string; icon: typeof FolderKanban }

const publishEntryMenuOptions: PublishMenuOption[] = [
  { type: 'project', label: '发布项目', description: '创建并发布新的项目需求', path: PROJECTS_CREATE_PATH, icon: FolderKanban },
  { type: 'note', label: '发布笔记', description: '撰写并分享图文或视频笔记', icon: BookOpenText },
]
const codeMenuOptions: PublishMenuOption[] = [
  { type: 'code-generate', label: '生成认证子码', description: '创建新的子码', icon: Ticket },
  { type: 'code-manage', label: '认证子码管理', description: '查看、停用、延期认证子码', icon: ListTodo },
]

function isSchoolEntity(code?: string): boolean { return typeof code === 'string' && code.trim().length === 5 }

// 05）顶部导航壳组件（TopNavbar）
function TopNavbar() {
  const { isLoggedIn, userProfile, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const activeNavItem = resolveActiveNavByPathname(location.pathname)
  const themeLabel = `切换到${theme === 'light' ? '深色' : '浅色'}主题`

  // 认证弹窗
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // 发布菜单
  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false)
  const publishMenuRef = useRef<HTMLDivElement | null>(null)

  // 学校认证码菜单
  const [isCodeMenuOpen, setIsCodeMenuOpen] = useState(false)
  const [isCodeGenerateModalOpen, setIsCodeGenerateModalOpen] = useState(false)
  const [isCodeManageModalOpen, setIsCodeManageModalOpen] = useState(false)

  // 角色判断
  const isOrgAdmin = isOrganizationAdminRole(userProfile?.userRole)
  const isCounselor = isCounselorRole(userProfile?.userRole)
  const isSchool = isSchoolEntity(userProfile?.entityCode)
  const showSchoolCodeEntry = isOrgAdmin && isSchool
  const showCodeEntryInPublish = isCounselor

  // 发布菜单选项
  const publishMenuOptions = useMemo(() => {
    let options = isCounselor ? publishEntryMenuOptions.filter(o => o.type === 'note') : [...publishEntryMenuOptions]
    if (showCodeEntryInPublish) options = [...options, ...codeMenuOptions]
    return options
  }, [isCounselor, showCodeEntryInPublish])

  // 关闭发布菜单（外部点击 + Escape）
  useEffect(() => {
    if (!isPublishMenuOpen && !isCodeMenuOpen) return
    const h = (e: MouseEvent) => { if (!(e.target instanceof Node) || publishMenuRef.current?.contains(e.target)) return; setIsPublishMenuOpen(false); setIsCodeMenuOpen(false) }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { setIsPublishMenuOpen(false); setIsCodeMenuOpen(false) } }
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [isPublishMenuOpen, isCodeMenuOpen])

  const handlePublishEntryClick = useCallback(() => {
    if (!isLoggedIn) { setIsAuthModalOpen(true); return }
    setIsPublishMenuOpen(prev => !prev); setIsCodeMenuOpen(false)
  }, [isLoggedIn])

  const handleNotifyClick = useCallback(() => { navigate('/messages') }, [navigate])
  const handleAuthEntryClick = useCallback(() => { setIsAuthModalOpen(true) }, [])

  const noteEditorTypeModal = useNoteEditorTypeModal({
    onSelect: (type) => {
      clearNoteDetailPreview()
      navigate(buildNoteEditorPath({ type }), { state: createPublishEntryFreshLocationState() })
    },
  })

  const handleSelectPublishType = useCallback((type: PublishEntryType) => {
    setIsPublishMenuOpen(false)
    setIsCodeMenuOpen(false)
    if (type === 'code-generate') { setIsCodeGenerateModalOpen(true); return }
    if (type === 'code-manage') { setIsCodeManageModalOpen(true); return }
    if (type === 'note') {
      noteEditorTypeModal.open()
      return
    }
    const opt = publishEntryMenuOptions.find(o => o.type === type)
    if (opt?.path) {
      navigate(opt.path, { state: createPublishEntryFreshLocationState() })
    }
  }, [navigate, noteEditorTypeModal])

  const handleLogout = useCallback(() => {
    void (async () => {
      const at = getAccessToken()
      const rt = getRefreshToken()
      try {
        if (at && rt) await logoutByTokens({ accessToken: at, refreshToken: rt })
      } catch (e) { console.warn('退出登录接口失败：', e) }
      finally {
        logout()
        window.location.reload()
      }
    })()
  }, [logout])

  return (
    <header className="top-header">
      <div className="top-header__inner">
        <BrandGroup />
        <NavMenu navItems={mainNavItemLabels} activeNavItem={activeNavItem} />

        <div className="header-actions">
          {/* 搜索框 */}
          <label className="top-header-search" htmlFor="top-header-search-input">
            <span className="top-header-search__icon">🔍</span>
            <input id="top-header-search-input" type="text" placeholder="搜索项目名称 / 企业名称 / 技术关键词" aria-label="搜索项目" />
          </label>

          {/* 登录 / 用户头像面板 */}
          {isLoggedIn ? (
            <UserProfileMenu onLogout={handleLogout} />
          ) : (
            <button className="login-entry-button" type="button" onClick={handleAuthEntryClick}>登录 / 注册</button>
          )}

          {/* 主题按钮 */}
          <button className={`theme-button theme-button--${theme}`} type="button" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>
            <span className="theme-button__glow" /><span className="theme-button__icon">{theme === 'light' ? '☀️' : '🌙'}</span>
          </button>

          {/* 通知按钮 */}
          <button className="notify-button" type="button" aria-label="消息通知" onClick={handleNotifyClick} title="打开即时通讯">
            <span className="notify-button__glow" />
            <span className="notify-button__icon"><MessageCircle size={18} strokeWidth={2.2} /></span>
          </button>

          {/* 学校认证码入口（组织管理员 + 学校主体） */}
          {showSchoolCodeEntry ? (
            <div className="publish-entry" ref={publishMenuRef}>
              <button type="button" className={`publish-entry-button ${isCodeMenuOpen ? 'publish-entry-button--open' : ''}`}
                aria-label="学校认证码" aria-haspopup="menu" aria-expanded={isCodeMenuOpen}
                onClick={() => { setIsCodeMenuOpen(prev => !prev); setIsPublishMenuOpen(false) }}>
                <Ticket size={16} strokeWidth={2.2} />
                <span>学校认证码</span>
                <ChevronDown size={14} strokeWidth={2.2} className={`publish-entry-button__chevron ${isCodeMenuOpen ? 'publish-entry-button__chevron--open' : ''}`} />
              </button>
              {isCodeMenuOpen ? (
                <div className="publish-entry-menu" role="menu" aria-label="认证码选项">
                  <button type="button" role="menuitem" className="publish-entry-menu__item" onClick={() => handleSelectPublishType('code-generate')}>
                    <span className="publish-entry-menu__item-icon"><Ticket size={16} /></span>
                    <span className="publish-entry-menu__item-text"><span className="publish-entry-menu__item-label">生成认证码</span><span className="publish-entry-menu__item-desc">创建新的母码</span></span>
                  </button>
                  <button type="button" role="menuitem" className="publish-entry-menu__item" onClick={() => handleSelectPublishType('code-manage')}>
                    <span className="publish-entry-menu__item-icon"><ListTodo size={16} /></span>
                    <span className="publish-entry-menu__item-text"><span className="publish-entry-menu__item-label">认证码管理</span><span className="publish-entry-menu__item-desc">查看、停用、延期认证码</span></span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* 发布按钮（非学校码入口时显示） */}
          {!showSchoolCodeEntry ? (
            <div className="publish-entry" ref={publishMenuRef}>
              <button type="button" className={`publish-entry-button ${isPublishMenuOpen ? 'publish-entry-button--open' : ''}`}
                aria-label="发布内容" aria-haspopup="menu" aria-expanded={isPublishMenuOpen}
                onClick={handlePublishEntryClick}>
                <Send size={16} strokeWidth={2.2} />
                <span>发布</span>
                <ChevronDown size={14} strokeWidth={2.2} className={`publish-entry-button__chevron ${isPublishMenuOpen ? 'publish-entry-button__chevron--open' : ''}`} />
              </button>
              {isPublishMenuOpen ? (
                <div className="publish-entry-menu" role="menu" aria-label="选择发布类型">
                  {publishMenuOptions.map(opt => <button key={opt.type} type="button" role="menuitem" className="publish-entry-menu__item" onClick={() => handleSelectPublishType(opt.type)}>
                    <span className="publish-entry-menu__item-icon"><opt.icon size={16} /></span>
                    <span className="publish-entry-menu__item-text"><span className="publish-entry-menu__item-label">{opt.label}</span><span className="publish-entry-menu__item-desc">{opt.description}</span></span>
                  </button>)}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* 认证弹窗（复用 features/auth-process 组件） */}
      <AuthModal open={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} />

      {/* 生成认证码弹窗（桩） */}
      {isCodeGenerateModalOpen ? (
        <div className="auth-modal-mask" role="presentation" onClick={() => setIsCodeGenerateModalOpen(false)}>
          <div className="auth-modal" role="dialog" onClick={e => e.stopPropagation()} style={{ width: '420px', height: 'auto', minHeight: '240px', gridTemplateColumns: '1fr', padding: '24px', margin: 'auto' }}>
            <h3>生成认证码</h3><p style={{ color: 'var(--text-soft)', margin: '12px 0' }}>此功能重构中…</p>
            <button className="login-entry-button" onClick={() => setIsCodeGenerateModalOpen(false)}>关闭</button>
          </div>
        </div>
      ) : null}

      {/* 认证码管理弹窗（桩） */}
      {isCodeManageModalOpen ? (
        <div className="auth-modal-mask" role="presentation" onClick={() => setIsCodeManageModalOpen(false)}>
          <div className="auth-modal" role="dialog" onClick={e => e.stopPropagation()} style={{ width: '560px', height: 'auto', minHeight: '320px', gridTemplateColumns: '1fr', padding: '24px', margin: 'auto' }}>
            <h3>认证码管理</h3><p style={{ color: 'var(--text-soft)', margin: '12px 0' }}>此功能重构中…</p>
            <button className="login-entry-button" onClick={() => setIsCodeManageModalOpen(false)}>关闭</button>
          </div>
        </div>
      ) : null}
      {/* 笔记类型选择弹窗 */}
      <NoteEditorTypeModal
        open={noteEditorTypeModal.isOpen}
        onClose={noteEditorTypeModal.close}
        onSelect={noteEditorTypeModal.selectType}
      />
    </header>
  )
}

// 06）用户头像悬浮菜单（UserProfileMenu）
function UserProfileMenu({ onLogout }: { onLogout: () => void }) {
  const { userProfile } = useAuth()
  // 通道类型：直接从 AuthContext 推导
  const isOrgAccount = isOrganizationAdminRole(userProfile?.userRole)
  const channel: ProfileMenuChannel | null = isOrgAccount ? 'organization' : userProfile ? 'personal' : null
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  const { avatarUrl, fallbackText: avatarFallbackText } = useUserAvatarData()
  // hover 打开面板时才请求 menu API，降低调用频率
  const { data: menuData } = useUserMenuData(isOpen)

  const localCache = getMenuCache()
  const displayName = menuData?.nickname?.trim() || localCache?.nickname?.trim() || (isOrgAccount ? (userProfile?.entityName ?? '机构') : (userProfile?.uid ?? '用户'))
  const displayLevel = menuData?.level ?? localCache?.level ?? 'N'
  // /profile?uid=
  const userId = userProfile?.uid ?? getUserUid()
  const profilePath = userId ? `/profile?uid=${encodeURIComponent(userId)}` : '/profile'
  const avatarHref = isOrgAccount && userProfile?.entityCode
    ? `/org?uid=${encodeURIComponent(userProfile.entityCode)}`
    : profilePath

  const levelWhitelist = ['N', 'R', 'SR', 'SSR', 'UR']
  const normalizedLevel = (levelWhitelist.includes(displayLevel?.toUpperCase() ?? '') ? displayLevel?.toUpperCase() : 'N') as 'N' | 'R' | 'SR' | 'SSR' | 'UR'
  const stats = useMemo(() => buildDefaultStats(), [])
  const isOrg = channel === 'organization'
  const menuItems = useMemo(() => {
    if (isOrg && userProfile?.entityCode) return buildOrganizationDefaultMenuItems(userProfile.entityCode)
    return buildPersonalDefaultMenuItems()
  }, [isOrg, userProfile?.entityCode])

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current) }, [])

  const clearCloseTimer = () => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
  }

  const handleEnter = () => { clearCloseTimer(); setIsOpen(true) }
  const handleLeave = () => {
    if (isLoggingOut) return
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => { setIsOpen(false); closeTimerRef.current = null }, 180)
  }

  const handleLogout = () => { if (isLoggingOut) return; clearCloseTimer(); setIsLoggingOut(true); onLogout() }

  return (
    <div className={`user-menu ${isOpen || isLoggingOut ? 'is-open' : ''}`} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <UserAvatar
        className="user-button"
        href={avatarHref}
        avatarUrl={avatarUrl}
        fallbackText={avatarFallbackText}
        alt={`${displayName}头像`}
      />
      <div className="user-panel" role="menu">
        <div className="user-panel__header">
          <div className="user-panel__name-row">
            <strong>{displayName}</strong>
            <LevelBadge level={normalizedLevel} className="user-level-badge" />
          </div>
        </div>
        <div className="user-panel__stats">
          {stats.map(s => (
            <button key={s.label} type="button" className="user-stat-item user-stat-button" onClick={() => window.open(profilePath, '_blank')}>
              <span className="user-stat-item__icon"><s.icon size={24} /></span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        <ul className="user-panel__menu-list">
          {menuItems.map(item => (
            <li key={item.key}>
              <button type="button" className="user-menu-item" onClick={() => { window.open(item.targetPath, '_blank'); setIsOpen(false) }}>
                <span className="user-menu-item__left"><span className="user-menu-item__icon"><item.icon size={24} /></span><span>{item.label}</span></span>
                <span className="user-menu-item__arrow"><ChevronRight size={24} /></span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="user-logout-button" onClick={handleLogout} disabled={isLoggingOut}>
          <span className="user-logout-button__icon"><LogOut size={24} /></span>
          <span>{isLoggingOut ? '正在退出登录…' : '退出登录'}</span>
        </button>
      </div>
    </div>
  )
}

export default TopNavbar
