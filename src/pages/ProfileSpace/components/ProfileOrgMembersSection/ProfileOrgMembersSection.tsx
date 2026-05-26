import type { ReactNode } from 'react'
import { OrgMemberCard } from '../OrgMemberCard'
import type { ProfileOrgMemberItem } from '../types'
import { ProfileTabSection } from '../ProfileTabSection'
import '../ProfileMembersSection/ProfileMembersSection.css'

// 01）机构人员区块 Props（ProfileOrgMembersSectionProps）
export interface ProfileOrgMembersSectionProps {
  title: string
  members: ProfileOrgMemberItem[]
  mode: 'preview' | 'full'
  emptyLabel?: string
  onViewAll?: () => void
  headerAction?: ReactNode
}

// 02）机构人员区块（ProfileOrgMembersSection）
/**
 * 函数名：ProfileOrgMembersSection
 * 功能：渲染机构空间人员预览或完整网格列表。
 * 输入：
 * - title：区块标题
 * - members：机构人员列表
 * - mode：preview 最多两行 | full 全部展示
 * - emptyLabel：空态文案
 * - onViewAll：预览模式「查看全部」回调
 * - headerAction：自定义右侧操作
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function ProfileOrgMembersSection({
  title,
  members,
  mode,
  emptyLabel = '暂无机构人员',
  onViewAll,
  headerAction,
}: ProfileOrgMembersSectionProps) {
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
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ProfileTabSection title={title} countLabel={countLabel} headerAction={resolvedHeaderAction}>
      {memberTotal > 0 ? (
        <div className={gridClassName}>
          {members.map((member) => (
            <OrgMemberCard key={member.uid} member={member} />
          ))}
        </div>
      ) : (
        <p className="profile-tab-empty">{emptyLabel}</p>
      )}
    </ProfileTabSection>
  )
}
