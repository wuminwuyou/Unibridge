import type { ReactNode } from 'react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import TopNavbar from '../../layout/TopNavbar'
import './ProfileSpaceShell.css'

// 01）个人空间 Tab 导航 Props（ProfileSpaceTabsProps）
interface ProfileSpaceTabsProps {
  tabs: readonly string[]
  activeTab: string
  onTabClick: (tab: string) => void
  ariaLabel: string
}

// 02）个人空间 Tab 导航（ProfileSpaceTabs）
/**
 * 函数名：ProfileSpaceTabs
 * 功能：渲染个人空间通用 Tab 导航条。
 * 输入：
 * - tabs / activeTab / onTabClick / ariaLabel
 * 输出：
 * - 返回值：React 节点
 */
export function ProfileSpaceTabs({ tabs, activeTab, onTabClick, ariaLabel }: ProfileSpaceTabsProps) {
  return (
    <nav className="profile-tabs" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`profile-tab ${tab === activeTab ? 'active' : ''}`}
          onClick={() => onTabClick(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}

// 03）壳层加载/错误态（ProfileSpaceShellStatus）
interface ProfileSpaceShellStatusProps {
  loadState: 'loading' | 'error'
  errorMessage?: string | null
  loadingLabel: string
}

/**
 * 函数名：ProfileSpaceShellStatus
 * 功能：展示壳层 loading / error 占位。
 */
export function ProfileSpaceShellStatus({
  loadState,
  errorMessage,
  loadingLabel,
}: ProfileSpaceShellStatusProps) {
  if (loadState === 'loading') {
    return (
      <div className="profile-space-shell-status">
        <LoadingSpinner size={32} label={loadingLabel} />
      </div>
    )
  }

  return (
    <p className="profile-space-shell-error" role="alert">
      {errorMessage ?? '加载失败，请稍后重试'}
    </p>
  )
}

// 04）个人空间通用壳层 Props（ProfileSpaceShellProps）
export interface ProfileSpaceShellProps {
  heroAriaLabel: string
  mainAriaLabel: string
  sidebarAriaLabel?: string
  heroVisual?: ReactNode
  heroContent: ReactNode
  tabs: ReactNode
  mainContent: ReactNode
  sidebar?: ReactNode
  contentGridClassName: string
  shouldRenderSidebar: boolean
  isSidebarCollapsed: boolean
}

// 05）个人空间通用壳层（ProfileSpaceShell）
/**
 * 函数名：ProfileSpaceShell
 * 功能：提供个人/团队/组织空间共享页面骨架（TopNavbar + Hero + 左主区 + 右拓展栏）。
 * 实现方法：
 * - 外层容器负责留白、双栏网格与侧栏折叠动画
 * - 变体通过 heroContent / mainContent / sidebar 插槽注入差异化 UI
 * 输入：
 * - ProfileSpaceShellProps
 * 输出：
 * - 返回值：React 节点
 */
export function ProfileSpaceShell({
  heroAriaLabel,
  mainAriaLabel,
  sidebarAriaLabel = '拓展信息侧边栏',
  heroVisual,
  heroContent,
  tabs,
  mainContent,
  sidebar,
  contentGridClassName,
  shouldRenderSidebar,
  isSidebarCollapsed,
}: ProfileSpaceShellProps) {
  return (
    <div className="profile-space-page">
      <TopNavbar />

      <section className="profile-hero" aria-label={heroAriaLabel}>
        {heroVisual ?? <div className="profile-hero__visual" aria-hidden="true" />}
        <div className="profile-hero__content">{heroContent}</div>
      </section>

      <main className="profile-space-main">
        <section className={contentGridClassName} aria-label={mainAriaLabel}>
          <div className="profile-left-column">
            {tabs}
            {mainContent}
          </div>

          {shouldRenderSidebar && sidebar ? (
            <aside
              className={`profile-right-column ${isSidebarCollapsed ? 'profile-right-column--collapsed' : ''}`}
              aria-label={sidebarAriaLabel}
              aria-hidden={isSidebarCollapsed}
            >
              {sidebar}
            </aside>
          ) : null}
        </section>
      </main>
    </div>
  )
}
