// 01）机构人员区块（ProfileOrgMembersSection）
import type { ReactNode } from 'react'
import { OrgMemberCard } from '@entities/member/ui/OrgMemberCard'
import type { ProfileOrgMemberItem } from '@entities/member/model'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import './ProfileMembersSection.css'

// 02）Props（ProfileOrgMembersSectionProps）
export interface ProfileOrgMembersSectionProps {
  title: string
  members: ProfileOrgMemberItem[]
  mode: 'preview' | 'full'
  emptyLabel?: string
  onViewAll?: () => void
  headerAction?: ReactNode
}

// 03）机构人员区块（ProfileOrgMembersSection）
/**
 * 函数名：ProfileOrgMembersSection
 * 功能：渲染机构空间人员预览（两行网格）或完整列表。
 * 输入：
 * - title / members / mode / emptyLabel / onViewAll / headerAction
 * 输出：
 * - 返回值：React 节点
 */
export function ProfileOrgMembersSection({
  title, members, mode, emptyLabel = '暂无机构人员', onViewAll, headerAction,
}: ProfileOrgMembersSectionProps) {
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
