// 01）由编辑表单构建图文详情预览载荷（buildNoteDetailFromEditorDraft）
import type { ContentLongtext } from '@entities/editor/lib/contentLongtext'
import { resolvePublishNoteSummary } from '@shared/lib/publishSummary'
import type { NoteEditorFormDraft } from '../services/noteEditorService'
import type { NoteDetailPublishStatus } from '@entities/note/model/noteDetailCommon'
import type { NoteArticleDetailPayload } from '@entities/note/model/noteDetailViewModel'

/**
 * 函数名：buildNoteDetailFromEditorDraft
 * 功能：将笔记编辑表单草稿与正文 longtext 转为图文阅读页预览载荷。
 * 实现方法：
 * - 合并 draft 标题/标签/摘要与 bodyContent.longtext
 * - 填充作者占位与 publishStatus
 * 输入：
 * - draft：NoteEditorFormDraft
 * - bodyContent：ContentLongtext
 * - coverUrl：封面 URL，可为 null
 * - publishStatus：预览态发布状态
 * 输出：
 * - 返回值：NoteArticleDetailPayload
 */
export function buildNoteDetailFromEditorDraft(
  draft: NoteEditorFormDraft,
  bodyContent: ContentLongtext,
  coverUrl: string | null,
  publishStatus: NoteDetailPublishStatus,
): NoteArticleDetailPayload {
  return {
    contentType: '图文',
    title: draft.title.trim() || '未命名笔记',
    summary:
      resolvePublishNoteSummary(draft.summary, draft.contentType, bodyContent.longtext, '') || '暂无摘要',
    body: bodyContent.longtext,
    tags: draft.tags,
    coverUrl,
    author: {
      uid: undefined,
      name: '我',
      organization: '',
      avatarUrl: null,
    },
    publishTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 10),
    views: 0,
    comments: 0,
    favorites: 0,
    publishStatus,
    parentNote: null,
  }
}
