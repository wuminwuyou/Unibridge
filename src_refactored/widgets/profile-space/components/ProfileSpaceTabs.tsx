// 01）个人/团队/机构空间通用 Tab 导航条（ProfileSpaceTabs）— 纯展示

// 02）Tab 导航 Props（ProfileSpaceTabsProps）
interface ProfileSpaceTabsProps {
  tabs: readonly string[]
  activeTab: string
  onTabClick: (tab: string) => void
  ariaLabel: string
}

// 03）Tab 导航组件（ProfileSpaceTabs）
/**
 * 函数名：ProfileSpaceTabs
 * 功能：渲染空间页顶部的 Tab 切换按钮组（个人/团队/机构 复用）。
 * 输入：
 * - tabs：Tab 列表
 * - activeTab：当前激活 Tab
 * - onTabClick：点击 Tab 的回调
 * - ariaLabel：无障碍标签
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
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
