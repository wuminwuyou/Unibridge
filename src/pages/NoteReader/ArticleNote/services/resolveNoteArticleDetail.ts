import {
  isNoteArticleDetailPayload,
  isNoteVideoDetailPayload,
  type NoteDetailPayload,
} from '../../shared/types/noteDetailPayload'
import { buildNoteArticleDetailFallback } from './buildNoteArticleDetailFallback'
import type { NoteArticleDetailPayload } from '../types'

// 01）解析图文笔记详情载荷（resolveNoteArticleDetail）
/**
 * 函数名：resolveNoteArticleDetail
 * 功能：从路由 state / session 预览 / URL 参数解析图文笔记详情数据。
 * 实现方法：
 * - 优先使用已解析的图文载荷
 * - contentType=视频 时返回 null
 * - 否则用标题生成演示兜底数据
 * 输入：
 * - resolvedPayload：state 或 session 中的载荷
 * - contentTypeFromQuery：URL contentType
 * - titleFromQuery：URL title
 * 输出：
 * - 返回值：NoteArticleDetailPayload 或 null
 */
export function resolveNoteArticleDetail(
  resolvedPayload: NoteDetailPayload | null | undefined,
  contentTypeFromQuery: string | null,
  titleFromQuery: string | null,
): NoteArticleDetailPayload | null {
  if (resolvedPayload && isNoteArticleDetailPayload(resolvedPayload)) {
    return resolvedPayload
  }

  if (contentTypeFromQuery === '视频') {
    return null
  }

  if (resolvedPayload && isNoteVideoDetailPayload(resolvedPayload)) {
    return null
  }

  return buildNoteArticleDetailFallback(titleFromQuery ?? '未命名笔记')
}
