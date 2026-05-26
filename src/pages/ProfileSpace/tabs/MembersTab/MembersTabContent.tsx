import type { TeamResourceUid } from '../../../../api/resourceUid'
import type { ProfileMemberItem } from '../../components/types'
import { ProfileMembersSection } from '../../components/ProfileMembersSection'

// 01）成员 Tab 内容 Props（MembersTabContentProps）
export interface MembersTabContentProps {
  title?: string
  teamUid: TeamResourceUid
  members: ProfileMemberItem[]
  isLoggedIn?: boolean
  isViewerTeamMember?: boolean
  emptyLabel?: string
  showManageMembers?: boolean
  onManageMembers: () => void
}

// 02）成员 Tab 内容（MembersTabContent）
/**
 * 函数名：MembersTabContent
 * 功能：渲染团队空间「成员」Tab 完整列表，并提供管理成员入口。
 * 输入：
 * - teamUid：团队 uid
 * - members：成员列表
 * - isLoggedIn / isViewerTeamMember：公共实验室名称展示上下文
 * - showManageMembers：是否展示「管理成员」入口（当前用户 isAdmin 为 true）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function MembersTabContent({
  title = '团队成员',
  teamUid,
  members,
  isLoggedIn = false,
  isViewerTeamMember = false,
  emptyLabel = '暂无团队成员',
  showManageMembers = false,
  onManageMembers,
}: MembersTabContentProps) {
  return (
    <ProfileMembersSection
      title={title}
      teamUid={teamUid}
      members={members}
      mode="full"
      isLoggedIn={isLoggedIn}
      isViewerTeamMember={isViewerTeamMember}
      emptyLabel={emptyLabel}
      headerAction={
        showManageMembers ? (
          <button type="button" className="profile-tab-section__action profile-tab-section__action--pill" onClick={onManageMembers}>
            管理成员
          </button>
        ) : null
      }
    />
  )
}
