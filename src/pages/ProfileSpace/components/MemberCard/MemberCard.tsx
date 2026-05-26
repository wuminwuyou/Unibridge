import LevelBadge from '../../../../components/common/LevelBadge'
import type { TeamResourceUid } from '../../../../api/resourceUid'
import type { ProfileMemberItem } from '../types'
import { resolveMemberDisplayName } from './memberDisplayUtils'
import { buildMemberMetaSegments, shouldShowMemberMetaSeparator } from './memberCardUtils'
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
/**
 * 函数名：MemberCard
 * 功能：渲染单个空间成员卡片，展示头像、名称、能力等级与团队身份/定位。
 * 实现方法：
 * - 公共实验室：登录且为团队成员时展示 realName，否则 nickname
 * - 次行展示：负责人 · 管理员 · 导师/学生 · career
 * 输入：
 * - member：ProfileMemberItem
 * - teamUid / isLoggedIn / isViewerTeamMember：公共实验室名称展示上下文
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
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
                <span className="profile-member-card__role-separator" aria-hidden="true">
                  ·
                </span>
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
