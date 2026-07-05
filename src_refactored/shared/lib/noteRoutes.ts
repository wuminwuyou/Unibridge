// 01）笔记相关前端路由（noteRoutes）
import { isNoteResourceUid } from '@shared/api/resourceUid'

/** 笔记大厅 */
export const NOTES_LIST_PATH = '/notes'

export const NOTES_EDITOR_PATH = '/notes/editor'

/** 笔记阅读页 `:id` 误匹配时需重定向至编辑页的段（与静态路由 editor/create 对应） */
export const NOTE_READER_EDITOR_REDIRECT_SEGMENTS = ['editor', 'create'] as const

/** @deprecated 使用 NOTE_READER_EDITOR_REDIRECT_SEGMENTS */
export const NOTE_READER_RESERVED_SEGMENTS = NOTE_READER_EDITOR_REDIRECT_SEGMENTS

/** 本地预览阅读页 `:id` 占位段（非真实笔记 uid，走阅读页 + session 预览，不重定向） */
export const NOTE_LOCAL_PREVIEW_SEGMENT = 'preview'

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

/** 解析编辑页 type query（resolveNoteEditorRouteType） */
export function resolveNoteEditorRouteType(type: string | null | undefined): 'article' | 'video' | null {
  if (type === 'article' || type === 'video') {
    return type
  }
  return null
}

/**
 * 函数名：buildNoteEditorPathWithDefaults
 * 功能：合并已有 query 并确保包含 type（缺省 article），供旧路由重定向使用。
 * 输入：
 * - search：location.search（含或不含前导 ?）
 * 输出：
 * - 返回值：完整 editor 路径
 */
export function buildNoteEditorPathWithDefaults(search = ''): string {
  const raw = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(raw)
  if (!params.get('type')) {
    params.set('type', 'article')
  }
  const query = params.toString()
  return query ? `${NOTES_EDITOR_PATH}?${query}` : buildNoteEditorPath({ type: 'article' })
}

/** 笔记详情（RESTful） */
export function buildNoteDetailPath(noteId: string): string {
  return `/notes/${encodeURIComponent(noteId)}`
}

/** 构建笔记本地预览阅读页路径（buildNoteLocalPreviewPath） */
export function buildNoteLocalPreviewPath(): string {
  return `${buildNoteDetailPath(NOTE_LOCAL_PREVIEW_SEGMENT)}?preview=1`
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
