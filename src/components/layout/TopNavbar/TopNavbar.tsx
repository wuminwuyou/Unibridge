import AuthModal from '../../AuthModal'
import BrandGroup from './components/BrandGroup'
import NavMenu from './components/NavMenu'
import HeaderActions from './components/HeaderActions'
import type { TopNavbarModel } from './useTopNavbar'

// 01）顶部导航纯视图参数（TopNavbarViewProps）
interface TopNavbarViewProps {
  navItems: string[]
  model: TopNavbarModel
}

// 02）顶部导航纯视图（TopNavbarView）
/**
 * 函数名：TopNavbarView
 * 功能：仅负责顶部导航的 DOM 结构与子组件拼装，不包含业务状态定义。
 * 实现方法：
 * - 左侧渲染 BrandGroup
 * - 中间渲染 NavMenu，传入 navItems 与高亮项
 * - 右侧渲染 HeaderActions，承载主题/通知/登录入口
 * - 在 header 中挂载 AuthModal，由 model 控制开关与回调
 * 输入：
 * - navItems：导航文案数组
 * - model：useTopNavbar 返回的状态与处理器
 * 输出：
 * - 返回值：JSX.Element，顶部导航整体结构
 * - 副作用：无（事件由 model 内处理器承担）
 */
export function TopNavbarView({ navItems, model }: TopNavbarViewProps) {
  return (
    <header className="top-header">
      <div className="top-header__inner">
        <BrandGroup />
        <NavMenu navItems={navItems} activeNavItem={model.activeNavItem} />
        <HeaderActions
          theme={model.theme}
          isAuthenticated={model.isAuthenticated}
          onToggleTheme={model.toggleTheme}
          onAuthEntryClick={model.handleAuthEntryClick}
          onNotifyClick={model.handleNotifyClick}
        />
      </div>

      <AuthModal
        open={model.isAuthModalOpen}
        onClose={model.handleCloseAuthModal}
        onSuccess={model.handleAuthSuccess}
      />
    </header>
  )
}
