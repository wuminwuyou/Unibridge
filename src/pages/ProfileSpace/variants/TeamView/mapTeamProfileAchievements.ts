import type { TeamProfileAchievementDto } from '../../../../api/teamProfile'
import type { TeamAchievementItem } from './types'

// 01）映射团队成果 DTO 列表（mapTeamProfileAchievements）
/**
 * 函数名：mapTeamProfileAchievements
 * 功能：将团队成果 DTO 数组映射为 TeamAchievementItem 视图模型。
 * 输入：
 * - achievements：接口成果数组
 * 输出：
 * - 返回值：TeamAchievementItem[]
 * - 副作用：无
 */
export function mapTeamProfileAchievements(
  achievements: TeamProfileAchievementDto[],
): TeamAchievementItem[] {
  return (achievements ?? []).map((achievement) => ({
    achievementUid: achievement.achievementUid,
    maskedProjectName: achievement.maskedProjectName,
    taskDescription: achievement.taskDescription,
    technicalTags: achievement.technicalTags ?? [],
    completedAt: achievement.completedAt,
  }))
}
