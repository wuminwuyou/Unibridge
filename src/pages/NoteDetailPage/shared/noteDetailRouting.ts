// 01）笔记详情链接参数（NoteDetailLinkParams）
export interface NoteDetailLinkParams {
  id?: number
  title: string
  contentType: '图文' | '视频'
}

// 02）构建笔记详情页路径（buildNoteDetailHref）
/**
 * 函数名：buildNoteDetailHref
 * 功能：根据 noteId 或标题+类型生成笔记详情页路由。
 * 实现方法：
 * - 有有效 id 时使用 ?id=
 * - 否则回退 title + contentType 演示跳转
 * 输入：
 * - params：id / title / contentType
 * 输出：
 * - 返回值：/note-detail 路径字符串
 */
export function buildNoteDetailHref(params: NoteDetailLinkParams): string {
  if (params.id != null && Number.isInteger(params.id) && params.id > 0) {
    return `/note-detail?id=${params.id}`
  }

  const searchParams = new URLSearchParams({
    title: params.title,
    contentType: params.contentType,
  })
  return `/note-detail?${searchParams.toString()}`
}

// 03）解析笔记详情 query id（parseNoteDetailIdFromQuery）
/**
 * 函数名：parseNoteDetailIdFromQuery
 * 功能：从 URL 查询参数解析 noteId。
 * 输入：
 * - rawId：searchParams.get('id')
 * 输出：
 * - 返回值：有效 noteId 或 null
 */
export function parseNoteDetailIdFromQuery(rawId: string | null): number | null {
  if (!rawId) {
    return null
  }

  const noteId = Number.parseInt(rawId, 10)
  if (!Number.isInteger(noteId) || noteId <= 0) {
    return null
  }

  return noteId
}
