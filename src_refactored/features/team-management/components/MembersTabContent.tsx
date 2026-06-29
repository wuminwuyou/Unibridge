// 01）团队成员 Tab 管理入口（MembersTabContent）
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import type { ProfileTabLoadState } from '@shared/types/loadState'
import { MembersList } from '@entities/member/ui/MembersList'
import type { ProfileMemberItem } from '@entities/member/model'

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
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
}

// 03）团队成员 Tab 内容（MembersTabContent）
/**
 * 函数名：MembersTabContent
 * 功能：渲染团队空间「成员」Tab 完整列表，并提供「管理成员」入口（管理动作 = Feature）。
 * 实现方法：
 * - 复用 entities/member/ui/MembersList 作为纯展示骨架
 * - 通过 headerAction 注入「管理成员」按钮（动词，归属 features）
 * - 支持 loadState 行内 loading/error 占位
 * 输入：
 * - title / teamUid / members / isLoggedIn / isViewerTeamMember / showManageMembers / onManageMembers / loadState
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无（onManageMembers 触发上层切换管理状态）
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
  loadState,
  errorMessage,
}: MembersTabContentProps) {
  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载团队成员…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载团队成员失败，请稍后重试'}
      </p>
    )
  }

  return (
    <MembersList
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
