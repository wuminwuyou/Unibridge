// 01）网格笔记卡片工具（grid-note-card-utils）
import type { NoteContentType } from './row-note-card-utils'

export interface GridNoteCardItem {
  id?: number
  title: string
  summary: string
  contentType: NoteContentType
  tags: string[]
  publishTime: string
  updateTime: string
  views: number
  comments: number
  favorites: number
  cover: string
  authorNickname?: string
  authorAvatar?: string
  videoDuration?: string
}

export function resolveGridNoteAuthorText(
  note: Pick<GridNoteCardItem, 'authorNickname'>,
): string {
  return note.authorNickname?.trim() || '匿名用户'
}

export function resolveGridNoteAuthorFallback(authorNickname: string | undefined): string {
  const trimmed = authorNickname?.trim()
  return trimmed ? trimmed.slice(0, 1) : 'U'
}

// 04）格式化笔记卡片日期（formatGridNoteCardDate）
/**
 * 函数名：formatGridNoteCardDate
 * 功能：将 Date 格式化为卡片展示用日期文案。
 * 实现方法：
 * - 年份为今年：仅输出 MM-DD（默认今年，省略年份）
 * - 非今年：输出 yyyy-MM-DD
 * 输入：
 * - date：已解析的日期对象
 * 输出：
 * - 返回值：展示用日期字符串
 * - 副作用：无
 */
function formatGridNoteCardDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  if (year === new Date().getFullYear()) {
    return `${month}-${day}`
  }
  return `${year}-${month}-${day}`
}

// 05）从时间字符串格式化笔记卡片日期（formatGridNoteCardDateFromString）
function formatGridNoteCardDateFromString(dateTime: string): string {
  const normalized = dateTime.replace('T', ' ').trim()
  if (!normalized) return ''
  const parsed = Date.parse(normalized.replace(' ', 'T'))
  if (Number.isNaN(parsed)) {
    const datePart = normalized.slice(0, 10)
    const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
    if (matched) {
      const [, yearText, month, day] = matched
      if (Number(yearText) === new Date().getFullYear()) {
        return `${month}-${day}`
      }
      return datePart
    }
    return datePart
  }
  return formatGridNoteCardDate(new Date(parsed))
}

export function resolveGridNoteRelativeTime(publishTime: string): string {
  const normalized = publishTime.replace('T', ' ').trim()
  const parsed = Date.parse(normalized.replace(' ', 'T'))
  if (Number.isNaN(parsed)) {
    return formatGridNoteCardDateFromString(normalized)
  }
  const diffM = Math.floor((Date.now() - parsed) / 60000)
  if (diffM < 1) return '刚刚'
  if (diffM < 60) return `${diffM} 分钟前`
  const diffH = Math.floor(diffM / 60)
  if (diffH < 24) return `${diffH} 小时前`
  return formatGridNoteCardDate(new Date(parsed))
}

// 06）格式化日期为卡片展示文案（formatGridNoteDateOnly）
function formatGridNoteDateOnly(dateTime: string): string {
  return formatGridNoteCardDateFromString(dateTime)
}

// 07）归一化日期时间键（normalizeGridNoteDateTimeKey）
function normalizeGridNoteDateTimeKey(dateTime: string): string {
  const normalized = dateTime.replace('T', ' ').trim()
  if (!normalized) return ''
  return normalized.slice(0, 16)
}

// 07）网格笔记智能更新时间类型（GridNoteSmartUpdateTime）
export type GridNoteSmartUpdateTime =
  | { kind: 'modified'; dateLabel: string }
  | { kind: 'relative'; label: string }

// 08）解析网格笔记智能更新时间（resolveGridNoteSmartUpdateTime）
/**
 * 函数名：resolveGridNoteSmartUpdateTime
 * 功能：为卡片 Footer 生成智能时效展示数据，优先突出最近修改。
 * 实现方法：
 * - updateTime 与 publishTime 不一致时返回 modified + 日期文案（展示为「修改于 …」）
 * - 否则回退相对发布时间（刚刚 / N 分钟前 / N 小时前 / MM-DD 或 yyyy-MM-DD）
 * 输入：
 * - publishTime：发布时间
 * - updateTime：最近更新时间
 * 输出：
 * - 返回值：GridNoteSmartUpdateTime
 * - 副作用：无
 */
export function resolveGridNoteSmartUpdateTime(
  publishTime: string,
  updateTime: string,
): GridNoteSmartUpdateTime {
  const publishKey = normalizeGridNoteDateTimeKey(publishTime)
  const updateKey = normalizeGridNoteDateTimeKey(updateTime)
  const effectiveUpdateKey = updateKey || publishKey

  if (effectiveUpdateKey && publishKey && effectiveUpdateKey !== publishKey) {
    return {
      kind: 'modified',
      dateLabel: formatGridNoteDateOnly(updateTime || publishTime),
    }
  }

  if (!publishKey && updateKey) {
    return {
      kind: 'modified',
      dateLabel: formatGridNoteDateOnly(updateTime),
    }
  }

  return {
    kind: 'relative',
    label: resolveGridNoteRelativeTime(publishTime || updateTime),
  }
}

// 09）格式化网格笔记智能更新时间为纯文本（formatGridNoteSmartUpdateTimeLabel）
/**
 * 函数名：formatGridNoteSmartUpdateTimeLabel
 * 功能：将智能更新时间结构转为 RowNoteCard 等纯文本场景可用的标签。
 * 实现方法：
 * - modified：输出「修改于 + 日期」
 * - relative：原样输出相对时效文案
 * 输入：
 * - time：resolveGridNoteSmartUpdateTime 的返回值
 * 输出：
 * - 返回值：展示用字符串
 * - 副作用：无
 */
export function formatGridNoteSmartUpdateTimeLabel(time: GridNoteSmartUpdateTime): string {
  return time.kind === 'modified' ? `修改于 ${time.dateLabel}` : time.label
}

export function resolveGridNoteVideoDuration(videoDuration: string | undefined): string {
  return videoDuration?.trim() || 'XX:XX'
}
