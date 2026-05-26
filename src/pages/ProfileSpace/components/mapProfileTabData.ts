import type { UserProfileNoteDto, UserProfileProjectDto } from '../../../api/userProfile'
import type { LevelCode } from '../../../types/level'
import type { ProjectCategory, ProjectItem, ProjectRecruitmentType, ProjectStatus } from '../../../types/project'
import type { ProfileNoteItem } from './types'

// 01）归一化项目等级（normalizeProjectLevel）
/**
 * 函数名：normalizeProjectLevel
 * 功能：将接口返回的项目等级字符串转换为 LevelCode。
 * 实现方法：
 * - 转大写并校验白名单
 * - 无效时回退为 N
 * 输入：
 * - level：接口等级字段
 * 输出：
 * - 返回值：LevelCode
 * - 副作用：无
 */
function normalizeProjectLevel(level: string): LevelCode {
  const normalizedLevel = level.trim().toUpperCase()
  const levelWhitelist: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']
  return levelWhitelist.includes(normalizedLevel as LevelCode) ? (normalizedLevel as LevelCode) : 'N'
}

// 02）归一化项目分类（normalizeProjectCategory）
function normalizeProjectCategory(category: string | undefined): ProjectCategory {
  return category === 'RECRUITMENT' ? 'RECRUITMENT' : 'COMMERCIAL'
}

// 03）归一化招募子类型（normalizeProjectRecruitmentType）
function normalizeProjectRecruitmentType(value: string | null | undefined): ProjectRecruitmentType | null {
  if (
    value === 'LAB_RECRUIT' ||
    value === 'TEAM_RECRUIT' ||
    value === 'CAMPUS_PRACTICE' ||
    value === 'PERSONAL_RECRUIT'
  ) {
    return value
  }
  return null
}

// 04）归一化项目状态（normalizeProjectStatus）
/**
 * 函数名：normalizeProjectStatus
 * 功能：将接口返回的 project.status 归一化为 ProjectStatus。
 * 输入：
 * - status：接口状态字段
 * 输出：
 * - 返回值：ProjectStatus | undefined（无效或缺失时不展示）
 * - 副作用：无
 */
function normalizeProjectStatus(status: string | undefined): ProjectStatus | undefined {
  const normalizedStatus = status?.trim().toUpperCase()
  if (
    normalizedStatus === 'DRAFT' ||
    normalizedStatus === 'OPEN' ||
    normalizedStatus === 'ONGOING' ||
    normalizedStatus === 'CLOSED'
  ) {
    return normalizedStatus
  }

  return undefined
}

// 05）归一化笔记内容类型（normalizeNoteContentType）
/**
 * 函数名：normalizeNoteContentType
 * 功能：将接口笔记 contentType 归一化为前端枚举。
 * 实现方法：
 * - 仅接受「图文」「视频」，其它值默认图文
 * 输入：
 * - contentType：接口内容类型
 * 输出：
 * - 返回值：ProfileNoteItem['contentType']
 * - 副作用：无
 */
function normalizeNoteContentType(contentType: string): ProfileNoteItem['contentType'] {
  return contentType === '视频' ? '视频' : '图文'
}

// 04.1）格式化个人空间笔记视频时长（formatProfileNoteVideoDuration）
function formatProfileNoteVideoDuration(value: string | number | null | undefined): string | undefined {
  if (value == null) {
    return undefined
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }

  if (!Number.isFinite(value) || value <= 0) {
    return undefined
  }

  const totalSeconds = Math.floor(value)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// 03）映射接口项目列表（mapApiProjects）
/**
 * 函数名：mapApiProjects
 * 功能：将 /user-profile/home 与 /user-profile/projects 的项目 DTO 转为 ProjectItem。
 * 实现方法：
 * - 逐条映射字段并归一化 level
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

// 05）映射接口笔记列表（mapApiNotes）
/**
 * 函数名：mapApiNotes
 * 功能：将 /user-profile/home 与 /user-profile/notes 的笔记 DTO 转为 ProfileNoteItem。
 * 实现方法：
 * - 逐条映射字段并归一化 contentType
 * 输入：
 * - notes：接口笔记数组
 * 输出：
 * - 返回值：ProfileNoteItem[]
 * - 副作用：无
 */
export function mapApiNotes(notes: UserProfileNoteDto[]): ProfileNoteItem[] {
  return (notes ?? []).map((note) => ({
    uid: note.uid,
    title: note.title,
    summary: note.summary,
    contentType: normalizeNoteContentType(note.contentType),
    tags: note.tags ?? [],
    publishTime: note.publishTime,
    updateTime: note.updateTime,
    views: note.views,
    comments: note.comments,
    favorites: note.favorites,
    cover: note.cover,
    authorNickname: (note.authorNickname ?? note.authorName)?.trim() || undefined,
    authorOrganization: note.authorOrganization?.trim() || undefined,
    authorAvatar: note.authorAvatar?.trim() || undefined,
    videoDuration: formatProfileNoteVideoDuration(note.videoDuration),
  }))
}
