import type { NoteContentType } from '../RowNoteCard/rowNoteCardUtils'

// 01）网格笔记卡片数据（GridNoteCardItem）
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
  authorOrganization?: string
  authorAvatar?: string
  videoDuration?: string
}

// 02）网格卡片类型标签（gridNoteTypeBadgeLabelMap）
const gridNoteTypeBadgeLabelMap: Record<NoteContentType, string> = {
  图文: '图文',
  视频: '视频',
}

// 03）解析网格卡片类型标签（resolveGridNoteTypeBadge）
/**
 * 函数名：resolveGridNoteTypeBadge
 * 功能：根据 contentType 返回网格卡片顶部分类徽章文案。
 * 输入：
 * - contentType：笔记内容类型
 * 输出：
 * - 返回值：类型标签字符串
 */
export function resolveGridNoteTypeBadge(contentType: NoteContentType): string {
  return gridNoteTypeBadgeLabelMap[contentType]
}

// 04）解析作者身份展示文案（resolveGridNoteAuthorText）
/**
 * 函数名：resolveGridNoteAuthorText
 * 功能：合并作者昵称与学校/组织信息为单行身份栏文案（公共区域不使用实名）。
 * 输入：
 * - note：含 authorNickname、authorOrganization 的笔记数据
 * 输出：
 * - 返回值：如「李学长 · 清华大学」
 */
export function resolveGridNoteAuthorText(
  note: Pick<GridNoteCardItem, 'authorNickname' | 'authorOrganization'>,
): string {
  const authorNickname = note.authorNickname?.trim() || '匿名用户'
  const organization = note.authorOrganization?.trim()

  return organization ? `${authorNickname} · ${organization}` : authorNickname
}

// 05）解析作者头像占位缩写（resolveGridNoteAuthorFallback）
/**
 * 函数名：resolveGridNoteAuthorFallback
 * 功能：无头像 URL 时取昵称首字作为圆形占位。
 */
export function resolveGridNoteAuthorFallback(authorNickname: string | undefined): string {
  const trimmed = authorNickname?.trim()
  if (!trimmed) {
    return 'U'
  }

  return trimmed.slice(0, 1)
}

// 06）格式化社交指标数量（formatGridNoteMetricCount）
/**
 * 函数名：formatGridNoteMetricCount
 * 功能：将大数字格式化为参考 UI 中的紧凑计数（如 1.8k）。
 */
export function formatGridNoteMetricCount(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1).replace(/\.0$/, '')}w`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }

  return String(value)
}

// 07）格式化发布日期（formatGridNotePublishDate）
/**
 * 函数名：formatGridNotePublishDate
 * 功能：将时间戳格式化为 YYYY-MM-DD 发布日期字符串。
 * 实现方法：
 * - 使用本地时区取年、月、日并补零
 * 输入：
 * - timestamp：毫秒时间戳
 * 输出：
 * - 返回值：如「2026-05-24」
 */
function formatGridNotePublishDate(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// 08）解析相对发布时间（resolveGridNoteRelativeTime）
/**
 * 函数名：resolveGridNoteRelativeTime
 * 功能：将 publishTime 转为相对时间或发布日期文案。
 * 实现方法：
 * - 1 分钟内显示「刚刚」，1 小时内显示「X 分钟前」
 * - 24 小时内显示「X 小时前」
 * - 超过 24 小时显示发布日期（YYYY-MM-DD）
 * 输入：
 * - publishTime：发布时间字符串
 * 输出：
 * - 返回值：相对时间或日期字符串
 */
export function resolveGridNoteRelativeTime(publishTime: string): string {
  const normalized = publishTime.replace('T', ' ').trim()
  const parsed = Date.parse(normalized.replace(' ', 'T'))

  if (Number.isNaN(parsed)) {
    return normalized.length > 10 ? normalized.slice(0, 10) : normalized
  }

  const diffMs = Date.now() - parsed
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) {
    return '刚刚'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours} 小时前`
  }

  return formatGridNotePublishDate(parsed)
}

// 09）解析视频时长展示（resolveGridNoteVideoDuration）
/**
 * 函数名：resolveGridNoteVideoDuration
 * 功能：返回视频笔记右下角时间码，缺省为占位值。
 */
export function resolveGridNoteVideoDuration(videoDuration: string | undefined): string {
  const trimmed = videoDuration?.trim()
  return trimmed || 'XX:XX'
}
