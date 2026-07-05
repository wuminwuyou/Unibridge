// 01）笔记相关前端路由（noteRoutes）
import { isNoteResourceUid } from '@shared/api/resourceUid'

/** 笔记大厅 */
export const NOTES_LIST_PATH = '/notes'

export const NOTES_EDITOR_PATH = '/notes/editor'

/** 笔记阅读页 `:id` 路由保留段（不可作为笔记 uid 解析） */
export const NOTE_READER_RESERVED_SEGMENTS = ['editor', 'create'] as const

/** 判断是否为笔记阅读页保留路由段（isNoteReaderReservedSegment） */
export function isNoteReaderReservedSegment(value: string | null | undefined): boolean {
  if (!value) {
    return false
  }
  return (NOTE_READER_RESERVED_SEGMENTS as readonly string[]).includes(value)
}

/** @deprecated 使用 NOTES_EDITOR_PATH */
export const NOTES_CREATE_PATH = NOTES_EDITOR_PATH

/** 构建笔记编辑页路径（buildNoteEditorPath） */
export function buildNoteEditorPath(options: {
  type: 'article' | 'video'
  uid?: string
}): string {
  const params = new URLSearchParams({ type: options.type })
  if (options.uid) params.set('uid', options.uid)
  return `${NOTES_EDITOR_PATH}?${params.toString()}`
}

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
