// 01）项目列表 DTO 映射工具（mapProjectListData）
import type {
  ProjectItem, ProjectCategory, ProjectRecruitmentType, ProjectStatus,
} from '@shared/types/project'
import type { LevelCode } from '@shared/types/level'
import type { UserProfileProjectDto } from '@entities/user/model/userProfileTypes'

// 02）归一化项目等级（normalizeProjectLevel）
function normalizeProjectLevel(level: string): LevelCode {
  const normalized = level.trim().toUpperCase()
  const whitelist: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']
  return whitelist.includes(normalized as LevelCode) ? (normalized as LevelCode) : 'N'
}

// 03）归一化项目分类（normalizeProjectCategory）
function normalizeProjectCategory(category: string | undefined): ProjectCategory {
  return category === 'RECRUITMENT' ? 'RECRUITMENT' : 'COMMERCIAL'
}

// 04）归一化招募子类型（normalizeProjectRecruitmentType）
function normalizeProjectRecruitmentType(value: string | null | undefined): ProjectRecruitmentType | null {
  if (
    value === 'LAB_RECRUIT' || value === 'TEAM_RECRUIT' ||
    value === 'CAMPUS_PRACTICE' || value === 'PERSONAL_RECRUIT'
  ) {
    return value
  }
  return null
}

// 05）归一化项目状态（normalizeProjectStatus）
function normalizeProjectStatus(status: string | undefined): ProjectStatus | undefined {
  const normalized = status?.trim().toUpperCase()
  if (
    normalized === 'DRAFT' || normalized === 'OPEN' ||
    normalized === 'ONGOING' || normalized === 'CLOSED'
  ) {
    return normalized
  }
  return undefined
}

// 06）批量映射项目列表 DTO（mapApiProjects）
/**
 * 函数名：mapApiProjects
 * 功能：将 /user-profile/* / /team-profile/* / /entity-profile/* 项目 DTO 转 ProjectItem。
 * 实现方法：
 * - 归一化等级 / 分类 / 招募子类型 / 状态
 * - preview/summary 回退、ownerOrganization/company 回退
 * 输入：
 * - projects：接口项目数组
 * 输出：
 * - 返回值：ProjectItem[]
 * - 副作用：无
 */
export function mapApiProjects(projects: UserProfileProjectDto[]): ProjectItem[] {
  return (projects ?? []).map((project) => {
    const category = normalizeProjectCategory(project.category)
    const recruitmentType =
      category === 'RECRUITMENT' ? normalizeProjectRecruitmentType(project.recruitmentType) : null
    return {
      uid: project.uid,
      title: project.title,
      preview: project.preview?.trim() || project.summary?.trim() || '',
      tags: project.tags ?? [],
      category,
      recruitmentType,
      ownerOrganization: project.ownerOrganization?.trim() || project.company?.trim() || '',
      publishTime: project.publishTime,
      level: normalizeProjectLevel(project.level),
      logoSvgUrl: project.logoSvgUrl?.trim() || null,
      teamSize: project.teamSize?.trim() || null,
      duration: project.duration?.trim() || null,
      status: normalizeProjectStatus(project.status),
    }
  })
}
