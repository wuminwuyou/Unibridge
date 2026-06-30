import type { NoteContentType } from '../rowNoteCardUtils'

export interface GridNoteCardItem {
  id?: number
  title: string; summary: string; contentType: NoteContentType; tags: string[]
  publishTime: string; updateTime: string; views: number; comments: number; favorites: number
  cover: string; authorNickname?: string; authorOrganization?: string; authorAvatar?: string; videoDuration?: string
}

const gridNoteTypeBadgeLabelMap: Record<NoteContentType, string> = { '图文': '图文', '视频': '视频' }

export function resolveGridNoteTypeBadge(contentType: NoteContentType): string { return gridNoteTypeBadgeLabelMap[contentType] }
export function resolveGridNoteAuthorText(note: Pick<GridNoteCardItem, 'authorNickname' | 'authorOrganization'>): string { return note.authorNickname?.trim() || '匿名用户' }
export function resolveGridNoteAuthorFallback(authorNickname: string | undefined): string { const t = authorNickname?.trim(); return t ? t.slice(0, 1) : 'U' }
export function formatGridNoteMetricCount(value: number): string { if (value >= 10000) return `${(value / 10000).toFixed(1).replace(/\.0$/, '')}w`; if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`; return String(value) }
export function resolveGridNoteRelativeTime(publishTime: string): string {
  const n = publishTime.replace('T', ' ').trim(); const p = Date.parse(n.replace(' ', 'T'))
  if (Number.isNaN(p)) return n.length > 10 ? n.slice(0, 10) : n
  const diffM = Math.floor((Date.now() - p) / 60000); if (diffM < 1) return '刚刚'; if (diffM < 60) return `${diffM} 分钟前`
  const diffH = Math.floor(diffM / 60); if (diffH < 24) return `${diffH} 小时前`
  const d = new Date(p); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
export function resolveGridNoteVideoDuration(videoDuration: string | undefined): string { return videoDuration?.trim() || 'XX:XX' }
