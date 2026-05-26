import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { buildTeamSpacePath } from '../../variants/TeamView/teamTabRouting'
import type { ProfileTeamPreviewItem } from '../types'
import './OrganizationTeamCard.css'

// 01）机构下属团队卡片 Props（OrganizationTeamCardProps）
interface OrganizationTeamCardProps {
  team: ProfileTeamPreviewItem
}

// 02）构建团队 Logo 占位地址（buildTeamLogoFallbackUrl）
function buildTeamLogoFallbackUrl(name: string): string {
  const seed = encodeURIComponent(name.trim().slice(0, 2) || 'LB')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=cbd5e1&color=334155`
}

// 03）机构下属团队卡片（OrganizationTeamCard）
/**
 * 函数名：OrganizationTeamCard
 * 功能：展示机构下属实验室/团队预览卡片，点击跳转团队空间。
 * 输入：
 * - team：ProfileTeamPreviewItem
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function OrganizationTeamCard({ team }: OrganizationTeamCardProps) {
  const logoUrl = team.logoUrl ?? buildTeamLogoFallbackUrl(team.name)
  const description = team.description?.trim()

  return (
    <Link className="organization-team-card" to={buildTeamSpacePath(team.teamUid)}>
      <img className="organization-team-card__logo" src={logoUrl} alt={`${team.name} Logo`} />
      <div className="organization-team-card__body">
        <strong className="organization-team-card__name">{team.name}</strong>
        {description ? <p className="organization-team-card__description">{description}</p> : null}
        <span className="organization-team-card__meta">
          <Users size={13} />
          {team.memberCount} 人
        </span>
      </div>
    </Link>
  )
}
