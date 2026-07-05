// 01）笔记编辑本地预览（noteEditorLocalPreview）
import { NotesApiError } from '@entities/note/api/noteApi'
import type { NoteDetailPayload } from '@entities/note/model/noteDetailViewModel'
import type { ContentLongtext } from '@entities/editor/lib/contentLongtext'
import type { NoteEditorFormDraft } from '../services/noteEditorService'
import {
  buildNoteDetailFromEditorDraft,
  buildNoteVideoDetailFromEditorDraft,
} from './buildNoteDetailFromEditorDraft'
import { validateNoteEditorDraftForLocalPreview } from './noteEditorValidation'
import {
  isRemoteAssetUrl,
} from './noteCoverUploadUtils'
import type { NoteEditorSubmitCoverState } from './noteEditorSubmitOrchestrator'

// 02）本地预览输入（NoteEditorLocalPreviewInput）
export interface NoteEditorLocalPreviewInput {
  draft: NoteEditorFormDraft
  bodyContent: ContentLongtext
  cover: NoteEditorSubmitCoverState
}

// 03）本地预览结果（NoteEditorLocalPreviewResult）
export interface NoteEditorLocalPreviewResult {
  payload: NoteDetailPayload
}

/**
 * 函数名：resolveLocalNoteCoverUrl
 * 功能：从编辑态封面状态中解析可用于阅读页展示的封面 URL，不上传服务端。
 * 实现方法：
 * - 优先 activePreviewUrl（blob/data/http）
 * - 回退 persistedCoverUrl 或 draft.coverUrl 中的远程地址
 * 输入：
 * - cover：提交时封面状态
 * - draftCoverUrl：草稿内已持久化的 coverUrl，可选
 * 输出：
 * - 返回值：封面 URL 或 null
 * - 副作用：无
 */
export function resolveLocalNoteCoverUrl(
  cover: NoteEditorSubmitCoverState,
  draftCoverUrl?: string,
): string | null {
  const activePreviewUrl = cover.activePreviewUrl?.trim()
  if (activePreviewUrl) {
    return activePreviewUrl
  }

  if (isRemoteAssetUrl(cover.persistedCoverUrl)) {
    return cover.persistedCoverUrl
  }

  const normalizedDraftCoverUrl = draftCoverUrl?.trim()
  if (isRemoteAssetUrl(normalizedDraftCoverUrl)) {
    return normalizedDraftCoverUrl
  }

  return null
}

/**
 * 函数名：resolveLocalNoteVideoUrl
 * 功能：解析视频笔记本地预览可用的 videoUrl（blob/data/http），不上传。
 * 输入：
 * - videoUrl：草稿中的 videoUrl
 * 输出：
 * - 返回值：可用于 `<video src>` 的 URL 或空字符串
 * - 副作用：无
 */
function resolveLocalNoteVideoUrl(videoUrl: string | undefined): string {
  const normalized = videoUrl?.trim()
  if (!normalized) {
    return ''
  }

  if (
    normalized.startsWith('blob:') ||
    normalized.startsWith('data:') ||
    isRemoteAssetUrl(normalized)
  ) {
    return normalized
  }

  return normalized
}

/**
 * 函数名：executeNoteEditorLocalPreview
 * 功能：基于当前编辑表单构建本地预览载荷，不调用封面上传或笔记保存 API。
 * 实现方法：
 * - resolveLocalNoteCoverUrl 解析封面
 * - validateNoteEditorDraftForLocalPreview 做轻量校验
 * - 按 contentType 构建图文/视频详情载荷
 * 输入：
 * - input：草稿、正文 longtext、封面状态
 * 输出：
 * - 返回值：NoteEditorLocalPreviewResult
 * - 副作用：无
 */
export function executeNoteEditorLocalPreview(
  input: NoteEditorLocalPreviewInput,
): NoteEditorLocalPreviewResult {
  const coverUrl = resolveLocalNoteCoverUrl(input.cover, input.draft.coverUrl)
  const validationError = validateNoteEditorDraftForLocalPreview(input.draft, coverUrl)
  if (validationError) {
    throw new NotesApiError(400, validationError)
  }

  if (input.draft.contentType === '图文') {
    return {
      payload: buildNoteDetailFromEditorDraft(
        input.draft,
        input.bodyContent,
        coverUrl,
        'PREVIEW',
      ),
    }
  }

  return {
    payload: buildNoteVideoDetailFromEditorDraft(
      input.draft,
      coverUrl,
      resolveLocalNoteVideoUrl(input.draft.videoUrl),
      'PREVIEW',
    ),
  }
}
