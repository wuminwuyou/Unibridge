// 01）笔记编辑表单工具（noteEditorFormUtils）
import type { ContentLongtext } from '@entities/editor/lib/contentLongtext'
import type { NoteEditorFormDraft } from '@features/note-editor'

// 02）同步正文到草稿（syncNoteEditorDraftBody）
/**
 * 函数名：syncNoteEditorDraftBody
 * 功能：将 Markdown longtext 同步写入 draft.bodyMarkdown。
 * 输入：
 * - draft：当前草稿
 * - bodyContent：正文 longtext
 * 输出：
 * - 返回值：更新后的 NoteEditorFormDraft
 */
export function syncNoteEditorDraftBody(
  draft: NoteEditorFormDraft,
  bodyContent: ContentLongtext,
): NoteEditorFormDraft {
  return {
    ...draft,
    bodyMarkdown: bodyContent.longtext,
  }
}

// 03）判断是否存在用户输入（hasNoteEditorUserInput）
/**
 * 函数名：hasNoteEditorUserInput
 * 功能：判断编辑表单是否含有任意有效用户输入，供离开守卫使用。
 * 输入：
 * - draft：NoteEditorFormDraft
 * - bodyContent：正文 longtext
 * - hasPendingLocalCover：是否存在尚未提交的本地封面预览
 * 输出：
 * - 返回值：boolean
 */
export function hasNoteEditorUserInput(
  draft: NoteEditorFormDraft,
  bodyContent: ContentLongtext,
  hasPendingLocalCover = false,
): boolean {
  return (
    draft.title.trim().length > 0
    || draft.summary.trim().length > 0
    || bodyContent.longtext.trim().length > 0
    || draft.videoDescription.trim().length > 0
    || draft.tags.length > 0
    || draft.coverUrl.trim().length > 0
    || hasPendingLocalCover
  )
}
