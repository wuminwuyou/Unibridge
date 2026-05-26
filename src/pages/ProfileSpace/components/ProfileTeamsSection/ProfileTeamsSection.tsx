import type { ReactNode } from 'react'
import { OrganizationTeamCard } from '../OrganizationTeamCard'
import type { ProfileTeamPreviewItem } from '../types'
import { ProfileTabSection } from '../ProfileTabSection'
import './ProfileTeamsSection.css'

// 01）机构实验室区块 Props（ProfileTeamsSectionProps）
export interface ProfileTeamsSectionProps {
  title: string
  teams: ProfileTeamPreviewItem[]
  mode: 'preview' | 'full'
  emptyLabel?: string
  onViewAll?: () => void
  headerAction?: ReactNode
}

// 02）机构实验室区块（ProfileTeamsSection）
/**
 * 函数名：ProfileTeamsSection
 * 功能：渲染机构下属实验室/团队预览或完整网格列表。
 * 输入：
 * - title：区块标题
 * - teams：团队预览列表
 * - mode：preview 限高 | full 全部展示
 * - emptyLabel：空态文案
 * - onViewAll：预览模式「查看全部」回调
 * - headerAction：自定义右侧操作
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function ProfileTeamsSection({
  title,
  teams,
  mode,
  emptyLabel = '暂无下属实验室',
  onViewAll,
  headerAction,
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
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ProfileTabSection title={title} countLabel={countLabel} headerAction={resolvedHeaderAction}>
      {teamTotal > 0 ? (
        <div className={gridClassName}>
          {teams.map((team) => (
            <OrganizationTeamCard key={team.teamUid} team={team} />
          ))}
        </div>
      ) : (
        <p className="profile-tab-empty">{emptyLabel}</p>
      )}
    </ProfileTabSection>
  )
}
