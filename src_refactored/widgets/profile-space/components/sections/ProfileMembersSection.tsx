// 01）空间成员区块（ProfileMembersSection）
import type { ReactNode } from 'react'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import { MemberCard } from '@entities/member/ui/MemberCard'
import type { ProfileMemberItem } from '@entities/member/model'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import './ProfileMembersSection.css'

// 02）Props（ProfileMembersSectionProps）
export interface ProfileMembersSectionProps {
  title: string
  members: ProfileMemberItem[]
  mode: 'preview' | 'full'
  teamUid?: TeamResourceUid
  isLoggedIn?: boolean
  isViewerTeamMember?: boolean
  emptyLabel?: string
  onViewAll?: () => void
  headerAction?: ReactNode
}

// 03）空间成员区块（ProfileMembersSection）
/**
 * 函数名：ProfileMembersSection
 * 功能：渲染团队空间成员预览（两行网格）或完整网格列表。
 * 输入：
 * - title / members / mode / teamUid / isLoggedIn / isViewerTeamMember /
 *   emptyLabel / onViewAll / headerAction
 * 输出：
 * - 返回值：React 节点
 */
export function ProfileMembersSection({
  title, members, mode, teamUid,
  isLoggedIn = false, isViewerTeamMember = false,
  emptyLabel = '暂无团队成员', onViewAll, headerAction,
}: ProfileMembersSectionProps) {
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
            <MemberCard
              key={member.uid}
              member={member}
              teamUid={teamUid}
              isLoggedIn={isLoggedIn}
              isViewerTeamMember={isViewerTeamMember}
            />
          ))}
        </div>
      ) : (
        <p className="profile-tab-empty">{emptyLabel}</p>
      )}
    </ProfileTabSection>
  )
}
