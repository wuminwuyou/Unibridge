import { isNoteVideoDetailPayload, type NoteDetailPayload } from '../shared/noteDetailPayload'
import { buildNoteVideoDetailFallback } from './buildNoteVideoDetailFallback'
import type { NoteVideoDetailPayload } from './types'

// 01）解析视频笔记详情载荷（resolveNoteVideoDetail）
/**
 * 函数名：resolveNoteVideoDetail
 * 功能：从路由 state / session 预览 / URL 参数解析视频笔记详情数据。
 * 实现方法：
 * - 优先使用已解析的视频载荷
 * - contentType=视频 且无载荷时用标题生成演示数据
 * 输入：
 * - resolvedPayload：state 或 session 中的载荷
 * - contentTypeFromQuery：URL contentType
 * - titleFromQuery：URL title
 * 输出：
 * - 返回值：NoteVideoDetailPayload 或 null
 */
export function resolveNoteVideoDetail(
  resolvedPayload: NoteDetailPayload | null | undefined,
  contentTypeFromQuery: string | null,
  titleFromQuery: string | null,
): NoteVideoDetailPayload | null {
  if (resolvedPayload && isNoteVideoDetailPayload(resolvedPayload)) {
    return resolvedPayload
  }

  if (contentTypeFromQuery === '视频') {
    return buildNoteVideoDetailFallback(titleFromQuery ?? '未命名视频笔记')
  }

  return null
}
