// 01）成员 Tab 内容（MembersTabContent）
import type { TeamResourceUid } from '@shared/api/resourceUid'
import type { ProfileMemberItem } from '@entities/member/model'
import { ProfileMembersSection } from '../sections/ProfileMembersSection'

// 02）成员 Tab 内容 Props（MembersTabContentProps）
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

// 03）成员 Tab 内容（MembersTabContent）
/**
 * 函数名：MembersTabContent
 * 功能：渲染团队空间「成员」Tab 完整列表，并提供管理成员入口。
 * 输入：
 * - teamUid / members / isLoggedIn / isViewerTeamMember / showManageMembers / onManageMembers
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
          <button
            type="button"
            className="profile-tab-section__action profile-tab-section__action--pill"
            onClick={onManageMembers}
          >
            管理成员
          </button>
        ) : null
      }
    />
  )
}
