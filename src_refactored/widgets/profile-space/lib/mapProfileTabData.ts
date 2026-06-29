// 01）空间 Tab 数据映射工具（mapProfileTabData）
import type { ProjectItem, ProjectCategory, ProjectRecruitmentType, ProjectStatus } from '@shared/types/project'
import type { LevelCode } from '@shared/types/level'
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import type {
  UserProfileNoteDto, UserProfileProjectDto,
} from '@entities/user/model/userProfileTypes'

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

// 06）归一化笔记内容类型（normalizeNoteContentType）
function normalizeNoteContentType(contentType: string): ProfileNoteItem['contentType'] {
  return contentType === '视频' ? '视频' : '图文'
}

// 07）格式化视频时长（formatProfileNoteVideoDuration）
function formatProfileNoteVideoDuration(value: string | number | null | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  if (!Number.isFinite(value) || value <= 0) return undefined
  const totalSeconds = Math.floor(value)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// 08）映射接口项目列表（mapApiProjects）
/**
 * 函数名：mapApiProjects
 * 功能：将 /user-profile/* / /team-profile/* / /entity-profile/* 项目 DTO 转 ProjectItem。
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

// 09）映射接口笔记列表（mapApiNotes）
/**
 * 函数名：mapApiNotes
 * 功能：将接口笔记 DTO 转 ProfileNoteItem。
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
