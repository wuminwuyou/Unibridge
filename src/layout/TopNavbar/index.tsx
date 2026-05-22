import './style.css'
import { TopNavbarView } from './TopNavbar'
import { useTopNavbar } from './useTopNavbar'
import type { TopNavbarProps } from './types'

// 01）顶部导航对外组件（TopNavbar）
/**
 * 函数名：TopNavbar
 * 功能：对外入口组件，挂载顶部导航业务 Hook 并将模型交给纯视图渲染。
 * 实现方法：
 * - 调用 useTopNavbar 聚合主题、路由高亮、登录弹窗等状态
 * - 将 model 与 navItems 一并传给 TopNavbarView 完成结构渲染
 * 输入：
 * - props：TopNavbarProps（navItems）
 * 输出：
 * - 返回值：JSX.Element，顶部导航
 * - 副作用：由 useTopNavbar 管理（主题切换、路由跳转）
 */
function TopNavbar({ navItems }: TopNavbarProps) {
  const model = useTopNavbar()

  return <TopNavbarView navItems={navItems} model={model} />
}

export default TopNavbar

export type { TopNavbarProps, NavRouteItem } from './types'
export type { TopNavbarModel } from './useTopNavbar'
