import { isNoteVideoDetailPayload, type NoteDetailPayload } from '../../shared/types/noteDetailPayload'
import type { NoteVideoDetailPayload } from '../types'

// 01）解析视频笔记详情载荷（resolveNoteVideoDetail）
/**
 * 函数名：resolveNoteVideoDetail
 * 功能：从路由 state / session 预览解析视频笔记详情数据。
 * 实现方法：
 * - 仅接受已解析的视频载荷（API 或 session 回退）
 * - 无有效载荷时返回 null，由页面展示「未找到」状态
 * 输入：
 * - resolvedPayload：state 或 session 中的载荷
 * - contentTypeFromQuery：URL contentType（保留参数以兼容调用方）
 * - titleFromQuery：URL title（保留参数以兼容调用方）
 * 输出：
 * - 返回值：NoteVideoDetailPayload 或 null
 */
export function resolveNoteVideoDetail(
  resolvedPayload: NoteDetailPayload | null | undefined,
  _contentTypeFromQuery: string | null,
  _titleFromQuery: string | null,
): NoteVideoDetailPayload | null {
  if (resolvedPayload && isNoteVideoDetailPayload(resolvedPayload)) {
    return resolvedPayload
  }

  return null
}
