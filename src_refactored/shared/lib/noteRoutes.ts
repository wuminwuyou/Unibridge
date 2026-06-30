// 01）笔记相关前端路由（noteRoutes）
import { isNoteResourceUid } from '@shared/api/resourceUid'

/** 笔记大厅 */
export const NOTES_LIST_PATH = '/notes'

/** 发布 / 创建笔记 */
export const NOTES_CREATE_PATH = '/notes/create'

/** 笔记详情（RESTful） */
export function buildNoteDetailPath(noteId: string): string {
  return `/notes/${encodeURIComponent(noteId)}`
}

/** 笔记详情路由解析入参（contentType 等非路由字段可传入但会被忽略） */
export interface NoteDetailRouteInput {
  uid?: string | null
  title: string
  contentType?: string
}

/** 笔记卡片跳转链接 */
export function resolveNoteDetailHref(note: NoteDetailRouteInput): string {
  if (isNoteResourceUid(note.uid)) {
    return buildNoteDetailPath(note.uid)
  }
  return buildNoteDetailPath(note.title)
}
