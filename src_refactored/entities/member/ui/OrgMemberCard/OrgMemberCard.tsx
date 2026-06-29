import { Link } from 'react-router-dom'
import LevelBadge from '@shared/ui/LevelBadge'
import type { ProfileOrgMemberItem, OrgPublicMemberRole } from '../../model'
import './OrgMemberCard.css'

// 01）机构人员卡片 Props（OrgMemberCardProps）
interface OrgMemberCardProps {
  member: ProfileOrgMemberItem
  /** 个人空间跳转路径，由上层注入（遵循 FSD 下层不依赖上层） */
  personalSpacePath?: string | null
}

// 02）构建机构人员头像占位地址（buildOrgMemberAvatarFallbackUrl）
function buildOrgMemberAvatarFallbackUrl(displayName: string): string {
  const seed = encodeURIComponent(displayName.trim().slice(0, 1) || 'U')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=e2e8f0&color=334155`
}

// 03）解析机构人员展示名称（resolveOrgMemberDisplayName）
export function resolveOrgMemberDisplayName(
  member: Pick<ProfileOrgMemberItem, 'nickname' | 'realName'>,
): string {
  const realName = member.realName?.trim() ?? ''
  const nickname = member.nickname.trim()
  return realName || nickname
}

// 04）解析机构人员身份文案（resolveOrgMemberRoleLabel）
export function resolveOrgMemberRoleLabel(orgRole: OrgPublicMemberRole): string {
  if (orgRole === 'PM') return '员工'
  if (orgRole === 'MENTOR') return '导师'
  return '辅导员'
}

// 05）机构人员卡片（OrgMemberCard）
export function OrgMemberCard({ member, personalSpacePath }: OrgMemberCardProps) {
  const displayName = resolveOrgMemberDisplayName(member)
  const roleLabel = resolveOrgMemberRoleLabel(member.orgRole)

  const cardBody = (
    <>
      <img
        className="org-member-card__avatar"
        src={member.avatarUrl ?? buildOrgMemberAvatarFallbackUrl(displayName)}
        alt={`${displayName}头像`}
      />
      <div className="org-member-card__body">
        <div className="org-member-card__name-row">
          <strong className="org-member-card__name">{displayName}</strong>
          {member.level ? <LevelBadge level={member.level} variant="pill" /> : null}
        </div>
        <p className="org-member-card__role">
          <span className="org-member-card__role-item">
            <span className="org-member-card__role-text">{roleLabel}</span>
          </span>
        </p>
      </div>
    </>
  )

  if (personalSpacePath) {
    return (
      <Link
        className="org-member-card org-member-card--linkable"
        to={personalSpacePath}
        aria-label={`查看${displayName}的个人空间`}
      >
        {cardBody}
      </Link>
    )
  }

  return <article className="org-member-card">{cardBody}</article>
}
