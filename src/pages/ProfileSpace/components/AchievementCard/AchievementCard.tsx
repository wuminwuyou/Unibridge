import type { ProfileAchievementItem } from '../types'
import './AchievementCard.css'

// 01）空间成果卡片 Props（AchievementCardProps）
interface AchievementCardProps {
  achievement: ProfileAchievementItem
}

// 02）空间成果卡片（AchievementCard）
/**
 * 函数名：AchievementCard
 * 功能：展示单条空间成果归档信息（脱敏项目名、总结与技术标签）。
 * 输入：
 * - achievement：ProfileAchievementItem
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <article className="profile-achievement-card">
      <header className="profile-achievement-card__head">
        <h3 className="profile-achievement-card__title">{achievement.maskedProjectName}</h3>
        <time className="profile-achievement-card__date" dateTime={achievement.completedAt}>
          {achievement.completedAt}
        </time>
      </header>
      <p className="profile-achievement-card__description">{achievement.taskDescription}</p>
      {achievement.technicalTags.length > 0 ? (
        <ul className="profile-achievement-card__tags">
          {achievement.technicalTags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
