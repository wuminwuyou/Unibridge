// 01）团队成果列表（AchievementsList）— 名词类纯展示
import type { ReactNode } from 'react'
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { ProfileTabLoadState } from '@shared/types/loadState'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import { AchievementCard, type ProfileAchievementItem } from '@entities/team/ui/AchievementCard'
import './AchievementsList.css'

// 02）成果列表 Props（AchievementsListProps）
export interface AchievementsListProps {
  title: string
  achievements: ProfileAchievementItem[]
  mode: 'preview' | 'full'
  previewLimit?: number
  emptyLabel?: string
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
  onViewAll?: () => void
  headerAction?: ReactNode
}

// 03）团队成果列表（AchievementsList）
/**
 * 函数名：AchievementsList
 * 功能：渲染团队空间的成果预览或完整列表（含可选加载/错误态）。
 * 输入：
 * - AchievementsListProps
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function AchievementsList({
  title,
  achievements,
  mode,
  previewLimit = 3,
  emptyLabel = '暂无团队成果',
  loadState,
  errorMessage,
  onViewAll,
  headerAction,
}: AchievementsListProps) {
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

  const isPreview = mode === 'preview'
  const visibleAchievements = isPreview ? achievements.slice(0, previewLimit) : achievements
  const achievementTotal = achievements.length
  const titleSuffix = !isPreview && achievementTotal > 0 ? `（${achievementTotal}）` : undefined

  const resolvedHeaderAction =
    headerAction ??
    (isPreview && achievementTotal > 0 && onViewAll ? (
      <button type="button" className="profile-tab-section__action" onClick={onViewAll}>
        查看全部
      </button>
    ) : undefined)

  return (
    <ProfileTabSection
      title={title}
      titleSuffix={titleSuffix}
      headerAction={resolvedHeaderAction}
    >
      {visibleAchievements.length > 0 ? (
        <div className="profile-space-achievement-list">
          {visibleAchievements.map((achievement) => (
            <AchievementCard key={achievement.achievementUid} achievement={achievement} />
          ))}
        </div>
      ) : (
        <p className="profile-tab-empty">{emptyLabel}</p>
      )}
    </ProfileTabSection>
  )
}
