// 01）解析返回编辑页路径（resolveNoteEditorReturnPath）
import { buildNoteEditorPath } from '@shared/lib/noteRoutes'
import type { NoteResourceUid } from '@shared/api/resourceUid'
import { loadNoteEditorFormSession } from './noteEditorFormSession'

/**
 * 函数名：resolveNoteEditorReturnPath
 * 功能：根据 session 与当前笔记 uid 生成「返回编辑」链接。
 * 实现方法：
 * - 优先 session 中的 routeType / noteUid
 * - 无 session 时用 fallbackNoteUid，默认 type=article
 * 输入：
 * - fallbackNoteUid：当前阅读页笔记 uid，可选
 * 输出：
 * - 返回值：/notes/editor?type=...&uid=... 路径
 * - 副作用：读取 sessionStorage
 */
export function resolveNoteEditorReturnPath(fallbackNoteUid?: NoteResourceUid | null): string {
  const session = loadNoteEditorFormSession()
  const routeType = session?.routeType ?? 'article'
  const uid = session?.noteUid ?? fallbackNoteUid ?? undefined
  return buildNoteEditorPath({
    type: routeType,
    uid: uid ?? undefined,
  })
}
