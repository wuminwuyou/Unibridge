// 01）机构下属实验室列表（OrgTeamsList）— 名词类纯展示
import type { ReactNode } from 'react'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import {
  OrganizationTeamCard,
  type ProfileTeamPreviewItem,
} from '@entities/team/ui/OrganizationTeamCard/OrganizationTeamCard'
import './OrgTeamsList.css'

// 02）实验室列表 Props（OrgTeamsListProps）
export interface OrgTeamsListProps {
  title: string
  teams: ProfileTeamPreviewItem[]
  mode: 'preview' | 'full'
  emptyLabel?: string
  /** 由上层（features/widgets）注入跳转路径构造器，避免 entities → features 反向依赖 */
  resolveTeamSpacePath: (teamUid: TeamResourceUid) => string
  onViewAll?: () => void
  headerAction?: ReactNode
}

// 03）机构下属实验室列表（OrgTeamsList）
/**
 * 函数名：OrgTeamsList
 * 功能：渲染机构下属实验室 / 团队预览或完整网格列表。
 * 实现方法：
 * - 通过 resolveTeamSpacePath 注入跳转路径，避免反向引用上层路由模块
 * 输入：
 * - OrgTeamsListProps
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function OrgTeamsList({
  title,
  teams,
  mode,
  emptyLabel = '暂无下属实验室',
  resolveTeamSpacePath,
  onViewAll,
  headerAction,
}: OrgTeamsListProps) {
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
              teamSpacePath={resolveTeamSpacePath(team.teamUid)}
            />
          ))}
        </div>
      ) : (
        <p className="profile-tab-empty">{emptyLabel}</p>
      )}
    </ProfileTabSection>
  )
}
