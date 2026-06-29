// 01）机构人员 Tab 内容（OrgMembersTabContent）
import type { ProfileOrgMemberItem } from '@entities/member/model'
import { ProfileOrgMembersSection } from '../sections/ProfileOrgMembersSection'

// 02）机构人员 Tab 内容 Props（OrgMembersTabContentProps）
export interface OrgMembersTabContentProps {
  title?: string
  members: ProfileOrgMemberItem[]
  emptyLabel?: string
  showManageMembers?: boolean
  onManageMembers?: () => void
}

// 03）机构人员 Tab 内容（OrgMembersTabContent）
/**
 * 函数名：OrgMembersTabContent
 * 功能：渲染机构空间「人员」Tab 完整列表，可切换管理表单。
 * 输入：
 * - members / emptyLabel / showManageMembers / onManageMembers
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
}: OrgMembersTabContentProps) {
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
    <ProfileOrgMembersSection
      title={title}
      members={members}
      mode="full"
      emptyLabel={emptyLabel}
      headerAction={headerAction}
    />
  )
}
