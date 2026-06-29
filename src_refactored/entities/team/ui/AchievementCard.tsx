// 01）团队成果卡片纯展示组件（AchievementCard）
import './AchievementCard.css'

// 02）团队成果项类型（ProfileAchievementItem）
export interface ProfileAchievementItem {
  achievementUid: string
  maskedProjectName: string
  taskDescription: string
  technicalTags: string[]
  completedAt: string
}

// 03）Props（AchievementCardProps）
interface AchievementCardProps {
  achievement: ProfileAchievementItem
}

// 04）团队成果卡片（AchievementCard）
/**
 * 函数名：AchievementCard
 * 功能：展示单条团队成果归档信息（脱敏项目名、总结、技术标签、完成日期）。
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
