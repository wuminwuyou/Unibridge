// 01）机构实验室区块（ProfileTeamsSection）
import type { ReactNode } from 'react'
import { OrganizationTeamCard } from '@entities/team/ui/OrganizationTeamCard'
import type { ProfileTeamPreviewItem } from '@entities/team/ui/OrganizationTeamCard/OrganizationTeamCard'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import { buildTeamSpacePath } from '../../lib/teamTabRouting'
import './ProfileTeamsSection.css'

// 02）Props（ProfileTeamsSectionProps）
export interface ProfileTeamsSectionProps {
  title: string
  teams: ProfileTeamPreviewItem[]
  mode: 'preview' | 'full'
  emptyLabel?: string
  onViewAll?: () => void
  headerAction?: ReactNode
}

// 03）机构实验室区块（ProfileTeamsSection）
/**
 * 函数名：ProfileTeamsSection
 * 功能：渲染机构下属实验室 / 团队预览或完整网格列表。
 * 实现方法：
 * - 通过 buildTeamSpacePath(teamUid) 计算跳转路径（widgets → entities Slot 注入）
 * 输入：
 * - title / teams / mode / emptyLabel / onViewAll / headerAction
 * 输出：
 * - 返回值：React 节点
 */
export function ProfileTeamsSection({
  title, teams, mode, emptyLabel = '暂无下属实验室', onViewAll, headerAction,
}: ProfileTeamsSectionProps) {
  const isPreview = mode === 'preview'
  const teamTotal = teams.length
  const countLabel = teamTotal > 0 ? `${teamTotal} 个` : undefined

  const resolvedHeaderAction =
    headerAction ??
    (isPreview && teamTotal > 0 && onViewAll ? (
      <button type="button" className="profile-tab-section__action" onClick={onViewAll}>
        查看全部
      </button>
    ) : undefined)

  const gridClassName = [
    'profile-space-teams-grid',
    isPreview ? 'profile-space-teams-grid--preview' : '',
  ].filter(Boolean).join(' ')

  return (
    <ProfileTabSection title={title} countLabel={countLabel} headerAction={resolvedHeaderAction}>
      {teamTotal > 0 ? (
        <div className={gridClassName}>
          {teams.map((team) => (
            <OrganizationTeamCard
              key={team.teamUid}
              team={team}
              teamSpacePath={buildTeamSpacePath(team.teamUid)}
            />
          ))}
        </div>
      ) : (
        <p className="profile-tab-empty">{emptyLabel}</p>
      )}
    </ProfileTabSection>
  )
}
