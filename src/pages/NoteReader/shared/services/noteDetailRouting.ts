import { isNoteResourceUid, parseNoteUidFromQuery } from '../../../../api/resourceUid'
import type { NoteResourceUid } from '../../../../api/resourceUid'

// 01）笔记详情链接参数（NoteDetailLinkParams）
export interface NoteDetailLinkParams {
  uid?: NoteResourceUid
  title: string
  contentType: '图文' | '视频'
}

// 02）构建笔记详情页路径（buildNoteDetailHref）
/**
 * 函数名：buildNoteDetailHref
 * 功能：根据笔记 uid 或标题+类型生成笔记详情页路由。
 * 实现方法：
 * - 有有效 uid 时使用 ?uid=
 * - 否则回退 title + contentType 演示跳转
 * 输入：
 * - params：uid / title / contentType
 * 输出：
 * - 返回值：/note-detail 路径字符串
 */
export function buildNoteDetailHref(params: NoteDetailLinkParams): string {
  if (isNoteResourceUid(params.uid)) {
    return `/note-detail?uid=${encodeURIComponent(params.uid)}`
  }

  const searchParams = new URLSearchParams({
    title: params.title,
    contentType: params.contentType,
  })
  return `/note-detail?${searchParams.toString()}`
}

// 03）解析笔记详情 query uid（parseNoteDetailUidFromQuery）
/**
 * 函数名：parseNoteDetailUidFromQuery
 * 功能：从 URL 查询参数解析笔记 uid。
 * 输入：
 * - uidParam：searchParams.get('uid')
 * - legacyIdParam：searchParams.get('id')
 * 输出：
 * - 返回值：有效 NoteResourceUid 或 null
 */
export function parseNoteDetailUidFromQuery(
  uidParam: string | null,
  legacyIdParam: string | null = null,
): NoteResourceUid | null {
  return parseNoteUidFromQuery(uidParam, legacyIdParam)
}

/** @deprecated 使用 parseNoteDetailUidFromQuery */
export function parseNoteDetailIdFromQuery(rawId: string | null): NoteResourceUid | null {
  return parseNoteDetailUidFromQuery(null, rawId)
}
