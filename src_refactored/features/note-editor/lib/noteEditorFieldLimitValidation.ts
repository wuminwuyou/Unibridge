// 01）笔记字段长度校验（noteEditorFieldLimitValidation）
import type { NoteEditorFormDraft } from '../services/noteEditorService'
import {
  NOTE_ARTICLE_BODY_MAX_LENGTH,
  NOTE_SUMMARY_MAX_LENGTH,
  NOTE_TAG_MAX_COUNT,
  NOTE_TAG_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
} from '../constants/noteEditorFieldLimits'

/**
 * 函数名：validateNoteEditorFieldLimits
 * 功能：校验笔记草稿各字段是否超出 noteEditorFieldLimits 定义的上限。
 * 输入：
 * - draft：NoteEditorFormDraft
 * 输出：
 * - 返回值：错误文案；通过时返回 null
 */
export function validateNoteEditorFieldLimits(draft: NoteEditorFormDraft): string | null {
  if (draft.title.length > NOTE_TITLE_MAX_LENGTH) {
    return `笔记标题不能超过 ${NOTE_TITLE_MAX_LENGTH} 字`
  }

  if (draft.contentType === '图文') {
    if (draft.summary.length > NOTE_SUMMARY_MAX_LENGTH) {
      return `笔记摘要不能超过 ${NOTE_SUMMARY_MAX_LENGTH} 字`
    }
    if (draft.bodyMarkdown.length > NOTE_ARTICLE_BODY_MAX_LENGTH) {
      return `图文正文不能超过 ${NOTE_ARTICLE_BODY_MAX_LENGTH} 字`
    }
  }

  if (draft.contentType === '视频') {
    if (draft.videoDescription.length > NOTE_SUMMARY_MAX_LENGTH) {
      return `笔记摘要不能超过 ${NOTE_SUMMARY_MAX_LENGTH} 字`
    }
  }

  if (draft.tags.length > NOTE_TAG_MAX_COUNT) {
    return `话题标签不能超过 ${NOTE_TAG_MAX_COUNT} 个`
  }

  if (draft.tags.some((tag) => tag.length > NOTE_TAG_MAX_LENGTH)) {
    return `单个话题标签不能超过 ${NOTE_TAG_MAX_LENGTH} 字`
  }

  return null
}
