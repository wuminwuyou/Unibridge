import type { ProfileOrgMemberItem } from '../../components/types'
import { ProfileOrgMembersSection } from '../../components/ProfileOrgMembersSection'

// 01）机构人员 Tab 内容 Props（OrgMembersTabContentProps）
export interface OrgMembersTabContentProps {
  title?: string
  members: ProfileOrgMemberItem[]
  emptyLabel?: string
  /** 是否显示「人员管理」入口按钮 */
  showManageMembers?: boolean
  /** 「人员管理」按钮点击回调 */
  onManageMembers?: () => void
}

// TODO: vibe coding实现，应该与文件MembersTabContent.tsx保持一致，使用相同的样式和组件。待重构
// 02）机构人员 Tab 内容（OrgMembersTabContent）
/**
 * 函数名：OrgMembersTabContent
 * 功能：渲染机构空间「人员」Tab 完整列表，可切换管理表单。
 * 输入：
 * - members：机构人员列表
 * - emptyLabel：空态文案
 * - showManageMembers：是否显示管理按钮
 * - onManageMembers：点击管理按钮回调
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
    <button type="button" className="profile-tab-section__action profile-tab-section__action--pill" onClick={onManageMembers}>
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
