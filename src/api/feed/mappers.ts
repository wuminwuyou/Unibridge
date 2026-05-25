import type { LevelCode } from '../../types/level'
import type { ProjectCategory, ProjectItem, ProjectRecruitmentType, ProjectTag } from '../../types/project'
import type { ProfileNoteItem } from '../../pages/ProfileSpace/components/types'
import type { FeedContentVo, FeedNoteType } from './types'

// 01）归一化项目等级（normalizeFeedProjectLevel）
/**
 * 函数名：normalizeFeedProjectLevel
 * 功能：将 Feed 项目卡片 level 转为 LevelCode。
 * 实现方法：
 * - 转大写并校验白名单
 * - 无效时回退 N
 * 输入：
 * - level：Feed 卡片等级字段
 * 输出：
 * - 返回值：LevelCode
 * - 副作用：无
 */
function normalizeFeedProjectLevel(level: string | undefined): LevelCode {
  const normalizedLevel = (level ?? 'N').trim().toUpperCase()
  const levelWhitelist: LevelCode[] = ['N', 'R', 'SR', 'SSR', 'UR']
  return levelWhitelist.includes(normalizedLevel as LevelCode) ? (normalizedLevel as LevelCode) : 'N'
}

// 02）归一化项目分类（normalizeFeedProjectCategory）
function normalizeFeedProjectCategory(category: string | undefined): ProjectCategory {
  return category === 'RECRUITMENT' ? 'RECRUITMENT' : 'COMMERCIAL'
}

// 03）归一化招募子类型（normalizeFeedRecruitmentType）
function normalizeFeedRecruitmentType(value: string | null | undefined): ProjectRecruitmentType | null {
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

// 04）归一化 Feed 标签（normalizeFeedTags）
/**
 * 函数名：normalizeFeedTags
 * 功能：将 Feed 卡片 tags（对象数组或字符串数组）统一为 ProjectTag[]。
 * 实现方法：
 * - 空值返回空数组
 * - 字符串数组映射为 { label }
 * - 对象数组直接透传 label
 * 输入：
 * - tags：Feed 卡片 tags 字段
 * 输出：
 * - 返回值：ProjectTag[]
 * - 副作用：无
 */
export function normalizeFeedTags(tags: FeedContentVo['tags']): ProjectTag[] {
  if (!tags?.length) {
    return []
  }

  if (typeof tags[0] === 'string') {
    return (tags as string[]).map((label) => ({ label }))
  }

  return (tags as ProjectTag[]).map((tag) => ({ label: tag.label }))
}

// 05）提取 Feed 标签字符串（extractFeedTagLabels）
/**
 * 函数名：extractFeedTagLabels
 * 功能：从 Feed 卡片 tags 提取字符串标签列表，供埋点上报使用。
 * 实现方法：
 * - 复用 normalizeFeedTags 后取 label
 * 输入：
 * - tags：Feed 卡片 tags 字段
 * 输出：
 * - 返回值：string[]
 * - 副作用：无
 */
export function extractFeedTagLabels(tags: FeedContentVo['tags']): string[] {
  return normalizeFeedTags(tags).map((tag) => tag.label)
}

// 06）映射 noteType 为前端内容类型（mapFeedNoteTypeToContentType）
function mapFeedNoteTypeToContentType(noteType: FeedNoteType | undefined): ProfileNoteItem['contentType'] {
  return noteType === 'VIDEO' ? '视频' : '图文'
}

// 06.1）格式化 Feed 视频时长（formatFeedVideoDuration）
/**
 * 函数名：formatFeedVideoDuration
 * 功能：将 Feed 返回的视频时长转为网格卡片 MM:SS 展示文案。
 * 实现方法：
 * - 已是 MM:SS 字符串则直接返回
 * - 数字按秒数格式化为 MM:SS
 * 输入：
 * - value：后端 videoDuration
 * 输出：
 * - 返回值：MM:SS 或 undefined
 */
function formatFeedVideoDuration(value: string | number | null | undefined): string | undefined {
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

// 07）映射 Feed 项目卡片（mapFeedProjectToProjectItem）
/**
 * 函数名：mapFeedProjectToProjectItem
 * 功能：将 Feed 项目 ContentVO 转为 ProjectItem，供 ProjectCard 渲染。
 * 实现方法：
 * - 映射 uid、preview、tags、category、recruitmentType 等字段
 * - 归一化 level 与空字符串兜底
 * 输入：
 * - item：Feed 项目卡片 VO
 * 输出：
 * - 返回值：ProjectItem
 * - 副作用：无
 */
export function mapFeedProjectToProjectItem(item: FeedContentVo): ProjectItem {
  const category = normalizeFeedProjectCategory(item.projectCategory)
  const recruitmentType =
    category === 'RECRUITMENT' ? normalizeFeedRecruitmentType(item.recruitmentType) : null

  return {
    uid: item.uid,
    title: item.title,
    preview: item.preview?.trim() || '',
    tags: normalizeFeedTags(item.tags),
    category,
    recruitmentType,
    ownerOrganization: item.ownerOrganization?.trim() || '',
    publishTime: item.publishTime ?? '',
    level: normalizeFeedProjectLevel(item.level),
    logoSvgUrl: item.logoSvgUrl?.trim() || null,
    teamSize: item.teamSize?.trim() || null,
    duration: item.duration?.trim() || null,
  }
}

// 08）映射 Feed 笔记卡片（mapFeedNoteToProfileNoteItem）
/**
 * 函数名：mapFeedNoteToProfileNoteItem
 * 功能：将 Feed 笔记 ContentVO 转为 ProfileNoteItem，供笔记卡片组件渲染。
 * 实现方法：
 * - 按 noteType 映射 contentType
 * - 数值字段缺省为 0，封面缺省为空字符串
 * 输入：
 * - item：Feed 笔记卡片 VO
 * 输出：
 * - 返回值：ProfileNoteItem
 * - 副作用：无
 */
export function mapFeedNoteToProfileNoteItem(item: FeedContentVo): ProfileNoteItem {
  const publishTime = item.publishTime ?? ''

  return {
    uid: item.uid,
    title: item.title,
    summary: item.summary?.trim() || '',
    contentType: mapFeedNoteTypeToContentType(item.noteType),
    tags: extractFeedTagLabels(item.tags),
    publishTime,
    updateTime: publishTime,
    views: item.views ?? 0,
    comments: item.likes ?? item.comments ?? 0,
    favorites: item.favorites ?? 0,
    cover: item.coverUrl?.trim() || '',
    authorNickname: (item.authorNickname ?? item.authorName)?.trim() || undefined,
    authorOrganization: item.authorOrganization?.trim() || undefined,
    authorAvatar: item.authorAvatar?.trim() || undefined,
    videoDuration: formatFeedVideoDuration(item.videoDuration),
  }
}

// 09）批量映射 Feed 项目列表（mapFeedProjects）
export function mapFeedProjects(items: FeedContentVo[]): ProjectItem[] {
  return (items ?? []).map(mapFeedProjectToProjectItem)
}

// 10）批量映射 Feed 笔记列表（mapFeedNotes）
export function mapFeedNotes(items: FeedContentVo[]): ProfileNoteItem[] {
  return (items ?? []).map(mapFeedNoteToProfileNoteItem)
}
