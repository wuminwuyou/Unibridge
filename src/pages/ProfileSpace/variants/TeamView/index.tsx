import './TeamView.css'
import { TeamView } from './TeamView'
import { useTeamViewPage } from './useTeamViewPage'

// 01）团队空间变体入口（TeamViewPage）
/**
 * 函数名：TeamViewPage
 * 功能：Team 变体对外入口，挂载 Hook 并渲染 TeamView。
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
export function TeamViewPage() {
  const model = useTeamViewPage()

  return <TeamView model={model} />
}

export { TeamView } from './TeamView'
export { useTeamViewPage } from './useTeamViewPage'
export { buildTeamMembersManagePath, buildTeamSpacePath, isTeamSpacePathname } from './teamTabRouting'
export type { TeamViewModel } from './useTeamViewPage'
export type { TeamCoreProfile, TeamExtendedProfile, TeamInfoRow, TeamMemberItem, TeamTab } from './types'
