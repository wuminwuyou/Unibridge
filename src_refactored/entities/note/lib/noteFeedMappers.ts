import type { NoteFeedContentVo } from '../api/noteFeedApi'
import { resolveNoteAuthorNickname } from './resolveNoteAuthorNickname'
import type { ProfileNoteItem } from '../model/profileNoteItem'

// 01）提取 Feed 标签字符串列表（extractNoteFeedTagLabels）
function extractNoteFeedTagLabels(tags: NoteFeedContentVo['tags']): string[] {
  if (!tags?.length) return []
  if (typeof tags[0] === 'string') return tags as string[]
  return (tags as Array<{ label: string }>).map((t) => t.label)
}

// 02）格式化 Feed 视频时长（formatFeedVideoDuration）
function formatFeedVideoDuration(value: string | number | null | undefined): string | undefined {
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

// 03）映射 Feed 笔记卡片（mapFeedNoteToProfileNoteItem）
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
export function mapFeedNoteToProfileNoteItem(item: NoteFeedContentVo): ProfileNoteItem {
  const publishTime = item.publishTime ?? ''
  const updateTime = item.updateTime ?? publishTime
  return {
    uid: item.uid,
    title: item.title,
    summary: item.summary?.trim() || item.preview?.trim() || '',
    contentType: item.noteType === 'VIDEO' ? '视频' : '图文',
    tags: extractNoteFeedTagLabels(item.tags),
    publishTime,
    updateTime,
    views: item.views ?? 0,
    comments: item.likes ?? item.comments ?? 0,
    favorites: item.favorites ?? 0,
    cover: item.coverUrl?.trim() || '',
    authorNickname: resolveNoteAuthorNickname(item),
    authorAvatar: item.authorAvatar?.trim() || undefined,
    videoDuration: formatFeedVideoDuration(item.videoDuration),
    status: item.status,
    visibility: item.visibility,
  }
}
