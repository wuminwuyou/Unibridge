import { Link } from 'react-router-dom'
import { isUserResourceUid } from '../../../../api/resourceUid'
import { buildPersonalSpacePath } from '../../variants/PersonalView/personalTabRouting'
import LevelBadge from '../../../../components/common/LevelBadge'
import type { ProfileOrgMemberItem } from '../types'
import { resolveOrgMemberDisplayName, resolveOrgMemberRoleLabel } from './orgMemberCardUtils'
import '../MemberCard/MemberCard.css'

// 01）机构人员卡片 Props（OrgMemberCardProps）
interface OrgMemberCardProps {
  member: ProfileOrgMemberItem
}

// 02）构建机构人员头像占位地址（buildOrgMemberAvatarFallbackUrl）
function buildOrgMemberAvatarFallbackUrl(displayName: string): string {
  const seed = encodeURIComponent(displayName.trim().slice(0, 1) || 'U')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=e2e8f0&color=334155`
}

// 03）机构人员卡片（OrgMemberCard）
/**
 * 函数名：OrgMemberCard
 * 功能：渲染单个机构关联人员卡片，展示头像、实名、能力等级与机构身份，点击跳转个人空间。
 * 实现方法：
 * - 名称默认展示 realName（机构公共空间公众人物）
 * - 有效 uid 时包裹 Link，跳转 /profile?uid=
 * 输入：
 * - member：ProfileOrgMemberItem
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function OrgMemberCard({ member }: OrgMemberCardProps) {
  const displayName = resolveOrgMemberDisplayName(member)
  const roleLabel = resolveOrgMemberRoleLabel(member.orgRole)
  const personalSpacePath = isUserResourceUid(member.uid) ? buildPersonalSpacePath(member.uid) : null

  const cardBody = (
    <>
      <img
        className="profile-member-card__avatar"
        src={member.avatarUrl ?? buildOrgMemberAvatarFallbackUrl(displayName)}
        alt={`${displayName}头像`}
      />
      <div className="profile-member-card__body">
        <div className="profile-member-card__name-row">
          <strong className="profile-member-card__name">{displayName}</strong>
          {member.level ? <LevelBadge level={member.level} variant="pill" /> : null}
        </div>
        <p className="profile-member-card__role">
          <span className="profile-member-card__role-item">
            <span className="profile-member-card__role-text">{roleLabel}</span>
          </span>
        </p>
      </div>
    </>
  )

  if (personalSpacePath) {
    return (
      <Link
        className="profile-member-card profile-member-card--linkable"
        to={personalSpacePath}
        aria-label={`查看${displayName}的个人空间`}
      >
        {cardBody}
      </Link>
    )
  }

  return <article className="profile-member-card">{cardBody}</article>
}
