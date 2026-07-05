// 01）笔记内容类型（NoteContentType）
import type { ProfileNoteItem } from '../../../model/profileNoteItem'
import { resolveGridNoteSmartUpdateTime, formatGridNoteSmartUpdateTimeLabel } from './grid-note-card-utils'

export type NoteContentType = '图文' | '视频'

// 02）笔记卡片元信息字段（NoteCardMetaFields）
export interface NoteCardMetaFields {
  publishTime: string
  updateTime: string
  views: number
}

// 03）笔记内容类型展示文案（noteContentTypeLabelMap）
const noteContentTypeLabelMap: Record<NoteContentType, string> = {
  图文: '图文',
  视频: '视频',
}

// 04）解析笔记卡片类型标签（resolveNoteCardTypeBadge）
export function resolveNoteCardTypeBadge(contentType: NoteContentType = '图文'): string {
  return noteContentTypeLabelMap[contentType ?? '图文']
}

// 06）解析笔记卡片底部元信息（resolveNoteCardMetaText）
/**
 * 函数名：resolveNoteCardMetaText
 * 功能：合并浏览量与智能更新时间为一行灰色元信息。
 * 实现方法：
 * - 浏览量保留数字原样展示
 * - 时间字段复用 resolveGridNoteSmartUpdateTime
 * 输入：
 * - note：含 publishTime、updateTime、views 的笔记数据
 * 输出：
 * - 返回值：以「 · 」连接的展示文案
 */
export function resolveNoteCardMetaText(note: NoteCardMetaFields): string {
  const smartTime = formatGridNoteSmartUpdateTimeLabel(
    resolveGridNoteSmartUpdateTime(note.publishTime, note.updateTime),
  )
  return [`${note.views} 浏览`, smartTime].filter(Boolean).join(' · ')
}

// 07）解析笔记卡片作者展示名（resolveNoteCardAuthorName）
/**
 * 函数名：resolveNoteCardAuthorName
 * 功能：从笔记卡片数据解析作者昵称展示文案。
 * 输入：
 * - note：含 authorNickname 的笔记数据
 * 输出：
 * - 返回值：作者昵称或「匿名用户」
 */
export function resolveNoteCardAuthorName(
  note: Pick<ProfileNoteItem, 'authorNickname'>,
): string {
  return note.authorNickname?.trim() || '匿名用户'
}
