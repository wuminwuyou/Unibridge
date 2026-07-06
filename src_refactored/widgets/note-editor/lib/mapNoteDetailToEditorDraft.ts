// 01）笔记详情载荷 → 编辑草稿映射（mapNoteDetailToEditorDraft）
import {
  createContentLongtext,
  type ContentLongtext,
} from '@entities/editor/lib/contentLongtext'
import type { NoteDetailPayload } from '@entities/note/model/noteDetailViewModel'
import { isNoteArticleDetailPayload, isNoteVideoDetailPayload } from '@entities/note/model/noteDetailViewModel'
import type { NoteEditorFormDraft } from '@features/note-editor'
import { normalizeNoteEditorCoverUrl } from '@shared/lib/noteCoverSentinel'

// 02）映射结果（NoteDetailToEditorDraftResult）
export interface NoteDetailToEditorDraftResult {
  draft: NoteEditorFormDraft
  bodyContent: ContentLongtext
}

/**
 * 函数名：mapNoteDetailToEditorDraft
 * 功能：将 GET /notes/{uid} 映射后的详情载荷转为编辑表单草稿与正文 longtext。
 * 实现方法：
 * - 图文：body → bodyMarkdown
 * - 视频：body → videoDescription，并保留 videoUrl / videoDuration
 * 输入：
 * - payload：NoteDetailPayload
 * 输出：
 * - 返回值：draft 与 bodyContent
 * - 副作用：无
 */
export function mapNoteDetailToEditorDraft(payload: NoteDetailPayload): NoteDetailToEditorDraftResult {
  if (isNoteVideoDetailPayload(payload)) {
    const draft: NoteEditorFormDraft = {
      title: payload.title,
      summary: payload.summary,
      contentType: '视频',
      bodyMarkdown: '',
      videoDescription: payload.body,
      tags: [...payload.tags],
      coverUrl: normalizeNoteEditorCoverUrl(payload.coverUrl),
      videoUrl: payload.videoUrl,
      videoDuration: payload.videoDuration,
    }

    return {
      draft,
      bodyContent: createContentLongtext('MARKDOWN', ''),
    }
  }

  if (isNoteArticleDetailPayload(payload)) {
    const body = payload.body ?? ''
    const draft: NoteEditorFormDraft = {
      title: payload.title,
      summary: payload.summary,
      contentType: '图文',
      bodyMarkdown: body,
      videoDescription: '',
      tags: [...payload.tags],
      coverUrl: normalizeNoteEditorCoverUrl(payload.coverUrl),
    }

    return {
      draft,
      bodyContent: createContentLongtext('MARKDOWN', body),
    }
  }

  return {
    draft: {
      title: '',
      summary: '',
      contentType: '图文',
      bodyMarkdown: '',
      videoDescription: '',
      tags: [],
      coverUrl: '',
    },
    bodyContent: createContentLongtext('MARKDOWN', ''),
  }
}
