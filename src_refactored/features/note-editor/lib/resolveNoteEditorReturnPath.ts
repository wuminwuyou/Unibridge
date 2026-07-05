// 01）解析返回编辑页路径（resolveNoteEditorReturnPath）
import { buildNoteEditorPath } from '@shared/lib/noteRoutes'
import type { NoteResourceUid } from '@shared/api/resourceUid'
import { loadNoteEditorFormSession } from './noteEditorFormSession'

/**
 * 函数名：resolveNoteEditorReturnPath
 * 功能：根据 session 生成「返回编辑」链接（仅 type，不含 uid）。
 * 实现方法：
 * - 从 session 读取 routeType，缺省 article
 * - 不在 URL 携带 uid，避免编辑页因 query uid 拉 API 覆盖 session 中未保存草稿
 * - noteUid 与表单内容由 sessionStorage（keepForRestore）恢复
 * 输入：
 * - _fallbackNoteUid：保留参数以兼容调用方，当前不参与 URL 构建
 * 输出：
 * - 返回值：/notes/editor?type=... 路径
 * - 副作用：读取 sessionStorage
 */
export function resolveNoteEditorReturnPath(_fallbackNoteUid?: NoteResourceUid | null): string {
  const session = loadNoteEditorFormSession()
  const routeType = session?.routeType ?? 'article'
  return buildNoteEditorPath({
    type: routeType,
  })
}
