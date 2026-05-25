import { PersonalViewPage } from './variants/PersonalView'
import { resolveProfileSpaceVariant } from './resolveProfileSpaceVariant'
import { useLocation } from 'react-router-dom'

// 01）个人空间页面入口（ProfileSpacePage）
/**
 * 函数名：ProfileSpacePage
 * 功能：个人空间通用壳层入口，按路由解析变体并渲染对应视图。
 * 实现方法：
 * - resolveProfileSpaceVariant 解析 personal / team / organization
 * - 当前默认渲染 PersonalViewPage（TeamView / OrganizationView 后续接入）
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
function ProfileSpacePage() {
  const { pathname } = useLocation()
  const variant = resolveProfileSpaceVariant(pathname)

  if (variant === 'personal') {
    return <PersonalViewPage />
  }

  return <PersonalViewPage />
}

export default ProfileSpacePage

export type { ProfileSpacePageModel, PersonalViewModel } from './variants/PersonalView'
export type { ProfileTab, UserCoreProfile, UserExtendedProfile, UserLaboratoryProfile } from './variants/PersonalView/types'
export type { ProfileSpaceShellLoadState, ProfileSpaceVariant } from './profileSpaceShellTypes'
export { buildProfileTabPath, isProfileSpacePathname } from './profileTabRouting'
export { resolveProfileSpaceVariant } from './resolveProfileSpaceVariant'
export { ProfileSpaceShell, ProfileSpaceTabs, ProfileSpaceShellStatus } from './ProfileSpaceShell'
