// 01）成果 Tab 内容（AchievementsTabContent）
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { ProfileAchievementItem } from '@entities/team/ui/AchievementCard'
import { ProfileAchievementsSection } from '../sections/ProfileAchievementsSection'
import type { ProfileTabLoadState } from '../../lib/profileTabLoadState'

// 02）成果 Tab 内容 Props（AchievementsTabContentProps）
export interface AchievementsTabContentProps {
  title?: string
  achievements: ProfileAchievementItem[]
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
  emptyLabel?: string
}

// 03）成果 Tab 内容（AchievementsTabContent）
/**
 * 函数名：AchievementsTabContent
 * 功能：渲染团队空间「成果」Tab 完整列表（含可选加载态）。
 * 输入：
 * - title / achievements / loadState / errorMessage / emptyLabel
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function AchievementsTabContent({
  title = '团队成果',
  achievements,
  loadState,
  errorMessage,
  emptyLabel = '暂无团队成果',
}: AchievementsTabContentProps) {
  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载团队成果…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载团队成果失败，请稍后重试'}
      </p>
    )
  }

  return (
    <ProfileAchievementsSection
      title={title}
      achievements={achievements}
      mode="full"
      emptyLabel={emptyLabel}
    />
  )
}
