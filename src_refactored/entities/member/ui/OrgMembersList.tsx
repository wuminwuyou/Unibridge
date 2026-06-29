// 01）机构人员列表（OrgMembersList）— 名词类纯展示
import type { ReactNode } from 'react'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import { OrgMemberCard } from '@entities/member/ui/OrgMemberCard'
import type { ProfileOrgMemberItem } from '@entities/member/model'
import './MembersList.css'

// 02）机构人员列表 Props（OrgMembersListProps）
export interface OrgMembersListProps {
  title: string
  members: ProfileOrgMemberItem[]
  mode: 'preview' | 'full'
  emptyLabel?: string
  onViewAll?: () => void
  headerAction?: ReactNode
}

// 03）机构人员列表（OrgMembersList）
/**
 * 函数名：OrgMembersList
 * 功能：渲染机构空间人员预览（两行网格）或完整列表。
 * 输入：
 * - OrgMembersListProps
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function OrgMembersList({
  title,
  members,
  mode,
  emptyLabel = '暂无机构人员',
  onViewAll,
  headerAction,
}: OrgMembersListProps) {
  const isPreview = mode === 'preview'
  const memberTotal = members.length
  const countLabel = memberTotal > 0 ? `${memberTotal} 人` : undefined

  const resolvedHeaderAction =
    headerAction ??
    (isPreview && memberTotal > 0 && onViewAll ? (
      <button type="button" className="profile-tab-section__action" onClick={onViewAll}>
        查看全部
      </button>
    ) : undefined)

  const gridClassName = [
    'profile-space-members-grid',
    isPreview ? 'profile-space-members-grid--preview' : '',
  ].filter(Boolean).join(' ')

  return (
    <ProfileTabSection title={title} countLabel={countLabel} headerAction={resolvedHeaderAction}>
      {memberTotal > 0 ? (
        <div className={gridClassName}>
          {members.map((member) => (
            <OrgMemberCard key={member.uid} member={member} />
          ))}
        </div>
      ) : (
        <p className="profile-tab-empty">{emptyLabel}</p>
      )}
    </ProfileTabSection>
  )
}
