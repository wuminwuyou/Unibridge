// 01）个人/团队/机构空间通用页壳（ProfileSpaceShell）— 仅负责布局骨架
import type { ReactNode } from 'react'
import TopNavbar from '@widgets/top-navbar'
import './ProfileSpaceShell.css'

// 02）通用空间页壳 Props（ProfileSpaceShellProps）
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

// 03）通用空间页壳（ProfileSpaceShell）
/**
 * 函数名：ProfileSpaceShell
 * 功能：提供个人/团队/机构空间共享页面骨架（TopNavbar + Hero + 左主区 + 右拓展栏）。
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
