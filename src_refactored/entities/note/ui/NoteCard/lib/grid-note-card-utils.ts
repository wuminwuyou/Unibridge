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
  authorOrganization?: string
  authorAvatar?: string
  videoDuration?: string
}

export function resolveGridNoteAuthorText(
  note: Pick<GridNoteCardItem, 'authorNickname' | 'authorOrganization'>,
): string {
  return note.authorNickname?.trim() || '匿名用户'
}

export function resolveGridNoteAuthorFallback(authorNickname: string | undefined): string {
  const trimmed = authorNickname?.trim()
  return trimmed ? trimmed.slice(0, 1) : 'U'
}

export function resolveGridNoteRelativeTime(publishTime: string): string {
  const normalized = publishTime.replace('T', ' ').trim()
  const parsed = Date.parse(normalized.replace(' ', 'T'))
  if (Number.isNaN(parsed)) return normalized.length > 10 ? normalized.slice(0, 10) : normalized
  const diffM = Math.floor((Date.now() - parsed) / 60000)
  if (diffM < 1) return '刚刚'
  if (diffM < 60) return `${diffM} 分钟前`
  const diffH = Math.floor(diffM / 60)
  if (diffH < 24) return `${diffH} 小时前`
  const date = new Date(parsed)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function resolveGridNoteVideoDuration(videoDuration: string | undefined): string {
  return videoDuration?.trim() || 'XX:XX'
}
