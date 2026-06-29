// 01）映射团队成果 DTO 列表（mapTeamProfileAchievements）
import type { TeamProfileAchievementDto } from '../model/types'
import type { ProfileAchievementItem } from '../ui/AchievementCard'

// 02）映射团队成果 DTO 列表（mapTeamProfileAchievements）
/**
 * 函数名：mapTeamProfileAchievements
 * 功能：将团队成果 DTO 数组映射为 AchievementCard 可用的视图模型。
 * 实现方法：
 * - 遍历 achievements，补齐 technicalTags 默认值
 * 输入：
 * - achievements：接口成果数组
 * 输出：
 * - 返回值：ProfileAchievementItem[]
 * - 副作用：无
 */
export function mapTeamProfileAchievements(
  achievements: TeamProfileAchievementDto[] | undefined,
): ProfileAchievementItem[] {
  return (achievements ?? []).map((achievement) => ({
    achievementUid: achievement.achievementUid,
    maskedProjectName: achievement.maskedProjectName,
    taskDescription: achievement.taskDescription,
    technicalTags: achievement.technicalTags ?? [],
    completedAt: achievement.completedAt,
  }))
}
