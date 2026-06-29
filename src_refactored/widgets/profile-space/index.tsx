// 01）空间页统筹大部件入口（ProfileSpaceWidget）
import { ProfileSpaceWidget as _ProfileSpaceWidget } from './ProfileSpaceWidget'
export const ProfileSpaceWidget = _ProfileSpaceWidget
export default ProfileSpaceWidget

// 02）公开导出
export { ProfileSpaceShell } from './components/ProfileSpaceShell'
export { ProfileSpaceTabs } from './components/ProfileSpaceTabs'
export { ProfileSpaceShellStatus } from './components/ProfileSpaceStatus'
export { PersonalSpaceWidget, TeamSpaceWidget, OrganizationSpaceWidget } from './ProfileSpaceWidget'
export { useProfileSpaceWidget } from './model/useProfileSpaceWidget'
export {
  resolveProfileSpaceVariant,
  type ProfileSpaceVariant,
  type ProfileSpaceShellLoadState,
} from '@features/profile-space/lib/profileSpaceVariant'
export {
  buildPersonalSpacePath,
  type PersonalProfileTab,
} from '@features/profile-space/lib/routing/personalTabRouting'
export {
  buildTeamSpacePath,
  buildTeamMembersManagePath,
  isTeamSpacePathname,
  type TeamProfileTab,
} from '@features/profile-space/lib/routing/teamTabRouting'
export {
  buildOrganizationSpacePath,
  isOrganizationSpacePathname,
  type OrganizationProfileTab,
} from '@features/profile-space/lib/routing/organizationTabRouting'
