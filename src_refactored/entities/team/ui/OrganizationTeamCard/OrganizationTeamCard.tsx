import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import './OrganizationTeamCard.css'

// 01）机构下属团队预览项类型（ProfileTeamPreviewItem）
export interface ProfileTeamPreviewItem {
  teamUid: TeamResourceUid
  name: string
  description: string | null
  logoUrl: string | null
  memberCount: number
  leaderUid?: string | null
  leaderDisplayName?: string | null
}

// 02）机构下属团队卡片 Props（OrganizationTeamCardProps）
interface OrganizationTeamCardProps {
  team: ProfileTeamPreviewItem
  /** 团队空间跳转路径，由上层注入 */
  teamSpacePath: string
}

// 03）构建团队 Logo 占位地址（buildTeamLogoFallbackUrl）
function buildTeamLogoFallbackUrl(name: string): string {
  const seed = encodeURIComponent(name.trim().slice(0, 2) || 'LB')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=cbd5e1&color=334155`
}

// 04）机构下属团队卡片（OrganizationTeamCard）
export function OrganizationTeamCard({ team, teamSpacePath }: OrganizationTeamCardProps) {
  const logoUrl = team.logoUrl ?? buildTeamLogoFallbackUrl(team.name)
  const description = team.description?.trim()

  return (
    <Link className="organization-team-card" to={teamSpacePath}>
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
