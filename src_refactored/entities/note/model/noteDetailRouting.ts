import { isNoteResourceUid } from '../../../shared/api/resourceUid'

// 01）构建笔记详情页路径（buildNoteDetailHref）
export function buildNoteDetailHref(note: { uid?: string | null; title: string; contentType: string }): string {
  if (isNoteResourceUid(note.uid)) return `/note-detail?uid=${encodeURIComponent(note.uid)}`
  return `/note-detail?title=${encodeURIComponent(note.title)}`
}
