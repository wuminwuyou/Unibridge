// 01）机构人员 Tab 管理入口（OrgMembersTabContent）
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { ProfileTabLoadState } from '@shared/types/loadState'
import { OrgMembersList } from '@entities/member/ui/OrgMembersList'
import type { ProfileOrgMemberItem } from '@entities/member/model'

// 02）机构人员 Tab 内容 Props（OrgMembersTabContentProps）
export interface OrgMembersTabContentProps {
  title?: string
  members: ProfileOrgMemberItem[]
  emptyLabel?: string
  showManageMembers?: boolean
  onManageMembers?: () => void
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
}

// 03）机构人员 Tab 内容（OrgMembersTabContent）
/**
 * 函数名：OrgMembersTabContent
 * 功能：渲染机构空间「人员」Tab 完整列表，可切换到「人员管理」表单（动词归属 features）。
 * 输入：
 * - title / members / emptyLabel / showManageMembers / onManageMembers / loadState / errorMessage
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function OrgMembersTabContent({
  title = '机构人员',
  members,
  emptyLabel = '暂无机构人员',
  showManageMembers = false,
  onManageMembers,
  loadState,
  errorMessage,
}: OrgMembersTabContentProps) {
  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载机构人员…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载机构人员失败，请稍后重试'}
      </p>
    )
  }

  const headerAction = showManageMembers && onManageMembers ? (
    <button
      type="button"
      className="profile-tab-section__action profile-tab-section__action--pill"
      onClick={onManageMembers}
    >
      人员管理
    </button>
  ) : undefined

  return (
    <OrgMembersList
      title={title}
      members={members}
      mode="full"
      emptyLabel={emptyLabel}
      headerAction={headerAction}
    />
  )
}
