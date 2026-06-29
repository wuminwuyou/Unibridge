import LevelBadge from '@shared/ui/LevelBadge'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import type { ProfileMemberItem } from '../../model'
import { resolveMemberDisplayName } from '../../lib/memberDisplayUtils'
import { buildMemberMetaSegments, shouldShowMemberMetaSeparator } from '../../lib/memberCardUtils'
import './MemberCard.css'

// 01）空间成员卡片 Props（MemberCardProps）
interface MemberCardProps {
  member: ProfileMemberItem
  teamUid?: TeamResourceUid
  isLoggedIn?: boolean
  isViewerTeamMember?: boolean
}

// 02）构建成员头像占位地址（buildMemberAvatarFallbackUrl）
function buildMemberAvatarFallbackUrl(displayName: string): string {
  const seed = encodeURIComponent(displayName.trim().slice(0, 1) || 'U')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=e2e8f0&color=334155`
}

// 03）空间成员卡片（MemberCard）
export function MemberCard({
  member,
  teamUid,
  isLoggedIn = false,
  isViewerTeamMember = false,
}: MemberCardProps) {
  const isLabSpace = typeof teamUid === 'string' && teamUid.trim().toUpperCase().startsWith('LB')
  const displayName = resolveMemberDisplayName(member, {
    context: 'public',
    isLabSpace,
    isLoggedIn,
    isViewerTeamMember,
  })
  const metaSegments = buildMemberMetaSegments(member)

  return (
    <article className="profile-member-card">
      <img
        className="profile-member-card__avatar"
        src={member.avatarUrl ?? buildMemberAvatarFallbackUrl(displayName)}
        alt={`${displayName}头像`}
      />
      <div className="profile-member-card__body">
        <div className="profile-member-card__name-row">
          <strong className="profile-member-card__name">{displayName}</strong>
          {member.level ? <LevelBadge level={member.level} variant="pill" /> : null}
        </div>
        <p className="profile-member-card__role">
          {metaSegments.map((segment, index) => (
            <span key={`${segment.kind}-${segment.label}`} className="profile-member-card__role-item">
              {shouldShowMemberMetaSeparator(metaSegments, index) ? (
                <span className="profile-member-card__role-separator" aria-hidden="true">·</span>
              ) : null}
              {segment.kind === 'owner' ? (
                <span className="profile-member-card__owner-badge">{segment.label}</span>
              ) : segment.kind === 'admin' ? (
                <span className="profile-member-card__admin-badge">{segment.label}</span>
              ) : (
                <span className="profile-member-card__role-text">{segment.label}</span>
              )}
            </span>
          ))}
        </p>
      </div>
    </article>
  )
}
