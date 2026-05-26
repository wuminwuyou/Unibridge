import { AchievementCard } from '../AchievementCard'
import type { ProfileAchievementItem } from '../types'
import { ProfileTabSection } from '../ProfileTabSection'
import './ProfileAchievementsSection.css'

// 01）空间成果区块 Props（ProfileAchievementsSectionProps）
export interface ProfileAchievementsSectionProps {
  title: string
  achievements: ProfileAchievementItem[]
  mode: 'preview' | 'full'
  previewLimit?: number
  emptyLabel?: string
  onViewAll?: () => void
}

// 02）空间成果区块（ProfileAchievementsSection）
/**
 * 函数名：ProfileAchievementsSection
 * 功能：渲染团队空间成果预览或完整列表。
 * 输入：
 * - title：区块标题
 * - achievements：成果列表
 * - mode：preview | full
 * - previewLimit：预览条数上限
 * - emptyLabel：空态文案
 * - onViewAll：预览模式跳转回调
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function ProfileAchievementsSection({
  title,
  achievements,
  mode,
  previewLimit = 3,
  emptyLabel = '暂无团队成果',
  onViewAll,
}: ProfileAchievementsSectionProps) {
  const isPreview = mode === 'preview'
  const visibleAchievements = isPreview ? achievements.slice(0, previewLimit) : achievements
  const achievementTotal = achievements.length
  const titleSuffix = !isPreview && achievementTotal > 0 ? `（${achievementTotal}）` : undefined

  return (
    <ProfileTabSection
      title={title}
      titleSuffix={titleSuffix}
      headerAction={
        isPreview && achievementTotal > 0 && onViewAll ? (
          <button type="button" className="profile-tab-section__action" onClick={onViewAll}>
            查看全部
          </button>
        ) : undefined
      }
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
