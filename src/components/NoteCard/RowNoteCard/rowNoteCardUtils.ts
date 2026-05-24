// 01）笔记内容类型（NoteContentType）
export type NoteContentType = '图文' | '视频'

// 02）笔记卡片元信息字段（NoteCardMetaFields）
export interface NoteCardMetaFields {
  publishTime: string
  views: number
  comments: number
  favorites: number
}

// 03）笔记内容类型展示文案（noteContentTypeLabelMap）
const noteContentTypeLabelMap: Record<NoteContentType, string> = {
  图文: '图文笔记',
  视频: '视频笔记',
}

// 04）解析笔记卡片类型标签（resolveNoteCardTypeBadge）
/**
 * 函数名：resolveNoteCardTypeBadge
 * 功能：根据 contentType 生成卡片顶部类型标签文案。
 * 输入：
 * - contentType：笔记内容类型，默认图文
 * 输出：
 * - 返回值：类型标签字符串
 */
export function resolveNoteCardTypeBadge(contentType: NoteContentType = '图文'): string {
  return noteContentTypeLabelMap[contentType ?? '图文']
}

// 05）格式化发布时间（formatNoteCardPublishTime）
/**
 * 函数名：formatNoteCardPublishTime
 * 功能：将发布时间格式化为卡片元信息行可读的「年月日 时分」。
 * 输入：
 * - publishTime：原始发布时间字符串
 * 输出：
 * - 返回值：格式化后的时间文本
 */
export function formatNoteCardPublishTime(publishTime: string): string {
  const normalizedTime = publishTime.replace('T', ' ').trim()

  if (normalizedTime.length <= 10) {
    return `${normalizedTime} 00:00`
  }

  return normalizedTime.slice(0, 16)
}

// 06）解析笔记卡片底部元信息（resolveNoteCardMetaText）
/**
 * 函数名：resolveNoteCardMetaText
 * 功能：合并发布时间、浏览、评论、收藏为一行灰色元信息。
 * 输入：
 * - note：含 publishTime、views、comments、favorites 的笔记数据
 * 输出：
 * - 返回值：以「 · 」连接的展示文案
 */
export function resolveNoteCardMetaText(note: NoteCardMetaFields): string {
  return [
    formatNoteCardPublishTime(note.publishTime),
    `${note.views} 浏览`,
    `${note.comments} 评论`,
    `${note.favorites} 收藏`,
  ].join(' · ')
}
