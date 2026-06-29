// 01）笔记列表 DTO 映射工具（mapNoteListData）
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import type { UserProfileNoteDto } from '@entities/user/model/userProfileTypes'

// 02）归一化笔记内容类型（normalizeNoteContentType）
function normalizeNoteContentType(contentType: string): ProfileNoteItem['contentType'] {
  return contentType === '视频' ? '视频' : '图文'
}

// 03）格式化视频时长（formatProfileNoteVideoDuration）
/**
 * 函数名：formatProfileNoteVideoDuration
 * 功能：将后端可能返回的字符串/秒数视频时长统一格式化为 mm:ss。
 * 实现方法：
 * - 字符串原样保留；数字按秒拆分为 mm:ss
 * 输入：
 * - value：原始时长，可为字符串/数字/空
 * 输出：
 * - 返回值：格式化字符串或 undefined
 * - 副作用：无
 */
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

// 04）批量映射笔记列表 DTO（mapApiNotes）
/**
 * 函数名：mapApiNotes
 * 功能：将接口笔记 DTO 转 ProfileNoteItem，归一化内容类型与作者展示字段。
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
