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

// 03）解析编辑态视频 URL（resolveEditorVideoUrl）
/**
 * 函数名：resolveEditorVideoUrl
 * 功能：从草稿、上传 Hook 与 session 备份字段中解析当前有效的视频预览地址。
 * 实现方法：
 * - 优先级：previewUrl → draft.videoUrl → persistedVideoUrl → sessionVideoPreviewUrl
 * 输入：
 * - draft：含 videoUrl 的草稿片段
 * - videoState：各来源的视频 URL
 * 输出：
 * - 返回值：trim 后的 videoUrl，无有效值时 undefined
 * - 副作用：无
 */
export function resolveEditorVideoUrl(
  draft: Pick<NoteEditorFormDraft, 'videoUrl'>,
  videoState: {
    previewUrl?: string | null
    persistedVideoUrl?: string | null
    sessionVideoPreviewUrl?: string | null
  },
): string | undefined {
  const candidates = [
    videoState.previewUrl,
    draft.videoUrl,
    videoState.persistedVideoUrl,
    videoState.sessionVideoPreviewUrl,
  ]

  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (trimmed) {
      return trimmed
    }
  }

  return undefined
}

// 04）判断是否存在用户输入（hasNoteEditorUserInput）
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
  hasPendingLocalVideo = false,
): boolean {
  return (
    draft.title.trim().length > 0
    || draft.summary.trim().length > 0
    || bodyContent.longtext.trim().length > 0
    || draft.videoDescription.trim().length > 0
    || draft.tags.length > 0
    || draft.coverUrl.trim().length > 0
    || Boolean(draft.videoUrl?.trim())
    || hasPendingLocalCover
    || hasPendingLocalVideo
  )
}
