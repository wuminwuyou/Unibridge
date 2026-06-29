// 01）空间页统筹大部件入口（ProfileSpaceWidget）
import type { ProfileSpaceVariant } from './lib/profileSpaceVariant'
import { PersonalSpaceWidget } from './components/PersonalSpaceWidget'
import { TeamSpaceWidget } from './components/TeamSpaceWidget'
import { OrganizationSpaceWidget } from './components/OrganizationSpaceWidget'
import { useProfileSpaceWidget } from './hooks/useProfileSpaceWidget'

// 02）空间页大部件 Props（ProfileSpaceWidgetProps）
interface ProfileSpaceWidgetProps {
  /** 由页面层显式注入，用于强制变体；不传则按 pathname 自动判定 */
  variant?: ProfileSpaceVariant
}

// 03）空间页大部件（ProfileSpaceWidget）
/**
 * 函数名：ProfileSpaceWidget
 * 功能：根据当前变体（个人 / 团队 / 机构）渲染对应的空间页区块。
 * 实现方法：
 * - 调用 useProfileSpaceWidget 解析变体
 * - 转发渲染到 PersonalSpaceWidget / TeamSpaceWidget / OrganizationSpaceWidget
 * 输入：
 * - variant：可选，页面层强制变体
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function ProfileSpaceWidget({ variant }: ProfileSpaceWidgetProps) {
  const model = useProfileSpaceWidget({ variant })

  if (model.variant === 'team') {
    return <TeamSpaceWidget />
  }
  if (model.variant === 'organization') {
    return <OrganizationSpaceWidget />
  }
  return <PersonalSpaceWidget />
}

// 04）默认导出（用于 pages 极薄入口的便捷引用）
export default ProfileSpaceWidget

// 05）公开导出
export { ProfileSpaceShell } from './components/ProfileSpaceShell'
export { ProfileSpaceTabs } from './components/ProfileSpaceTabs'
export { ProfileSpaceShellStatus } from './components/ProfileSpaceStatus'
export { PersonalSpaceWidget } from './components/PersonalSpaceWidget'
export { TeamSpaceWidget } from './components/TeamSpaceWidget'
export { OrganizationSpaceWidget } from './components/OrganizationSpaceWidget'
export { useProfileSpaceWidget } from './hooks/useProfileSpaceWidget'
export {
  resolveProfileSpaceVariant,
  type ProfileSpaceVariant,
  type ProfileSpaceShellLoadState,
} from './lib/profileSpaceVariant'
export {
  buildPersonalSpacePath,
  type PersonalProfileTab,
} from './lib/personalTabRouting'
export {
  buildTeamSpacePath,
  buildTeamMembersManagePath,
  isTeamSpacePathname,
  type TeamProfileTab,
} from './lib/teamTabRouting'
export {
  buildOrganizationSpacePath,
  isOrganizationSpacePathname,
  type OrganizationProfileTab,
} from './lib/organizationTabRouting'
