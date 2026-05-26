import './PersonalView.css'
import { PersonalView } from './PersonalView'
import { usePersonalViewPage } from './usePersonalViewPage'

// 01）个人用户空间变体入口（PersonalViewPage）
/**
 * 函数名：PersonalViewPage
 * 功能：Personal 变体对外入口，挂载 Hook 并渲染 PersonalView。
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
export function PersonalViewPage() {
  const model = usePersonalViewPage()

  return <PersonalView model={model} />
}

export { PersonalView } from './PersonalView'
export { usePersonalViewPage } from './usePersonalViewPage'
export type { PersonalViewModel, ProfileSpacePageModel } from './usePersonalViewPage'
export type { ProfileTab, UserAssociatedTeam, UserCoreProfile, UserExtendedProfile } from './types'
