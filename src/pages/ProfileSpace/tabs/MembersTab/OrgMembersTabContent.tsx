import type { ProfileOrgMemberItem } from '../../components/types'
import { ProfileOrgMembersSection } from '../../components/ProfileOrgMembersSection'

// 01）机构人员 Tab 内容 Props（OrgMembersTabContentProps）
export interface OrgMembersTabContentProps {
  title?: string
  members: ProfileOrgMemberItem[]
  emptyLabel?: string
}

// 02）机构人员 Tab 内容（OrgMembersTabContent）
/**
 * 函数名：OrgMembersTabContent
 * 功能：渲染机构空间「人员」Tab 完整列表。
 * 输入：
 * - members：机构人员列表
 * - emptyLabel：空态文案
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function OrgMembersTabContent({
  title = '机构人员',
  members,
  emptyLabel = '暂无机构人员',
}: OrgMembersTabContentProps) {
  return (
    <ProfileOrgMembersSection title={title} members={members} mode="full" emptyLabel={emptyLabel} />
  )
}
