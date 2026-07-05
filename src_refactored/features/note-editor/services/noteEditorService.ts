// 01）笔记编辑 Feature — 提交服务（noteEditorService）
/**
 * 函数名：noteEditorService（模块）
 * 功能：笔记编辑页表单草稿类型定义、请求体构建与 create/update 提交。
 * 实现方法：
 * - NoteEditorFormDraft 描述编辑态表单字段
 * - buildUpsertNoteRequest 将草稿转为 UpsertNoteRequest
 * - submitNote 按 publishAction 调用 createNote 或 updateNote
 * 输入/输出：见各导出函数 JSDoc
 */
import { resolvePublishNoteSummary } from '@shared/lib/publishSummary'
import { createNote, updateNote } from '@entities/note/api/noteApi'
import type { UpsertNoteRequest, NotePublishAction } from '@entities/note/model/types'
import type { NoteResourceUid } from '@shared/api/resourceUid'

// 02）笔记编辑内容类型（NoteEditorContentType）— 与 API / entities 保持一致
export type NoteEditorContentType = UpsertNoteRequest['contentType']

// 03）笔记编辑表单草稿（NoteEditorFormDraft）
export interface NoteEditorFormDraft {
  title: string
  summary: string
  contentType: NoteEditorContentType
  bodyMarkdown: string
  videoDescription: string
  tags: string[]
  coverUrl: string
  videoUrl?: string
  videoDuration?: number
}

// 04）构建笔记 upsert 请求体（buildUpsertNoteRequest）
/**
 * 函数名：buildUpsertNoteRequest
 * 功能：将编辑表单草稿与发布动作合并为 API 请求体。
 * 输入：
 * - draft：NoteEditorFormDraft
 * - publishAction：DRAFT | PUBLISH
 * 输出：
 * - 返回值：UpsertNoteRequest
 */
export function buildUpsertNoteRequest(
  draft: NoteEditorFormDraft,
  publishAction: NotePublishAction,
): UpsertNoteRequest {
  const isVideo = draft.contentType === '视频'
  return {
    publishAction,
    title: draft.title.trim(),
    summary: resolvePublishNoteSummary(
      draft.summary,
      draft.contentType,
      draft.bodyMarkdown,
      draft.videoDescription,
    ),
    contentType: draft.contentType,
    content: isVideo ? draft.videoDescription : draft.bodyMarkdown,
    tags: draft.tags,
    coverUrl: draft.coverUrl,
    videoUrl: draft.videoUrl,
    videoDuration: draft.videoDuration,
  }
}

// 05）提交笔记（submitNote）
/**
 * 函数名：submitNote
 * 功能：创建或更新笔记（由 existingUid 区分）。
 * 输入：
 * - draft、publishAction、existingUid（可选）
 * 输出：
 * - 返回值：UpsertNoteResponse（经 noteApi 包装）
 * - 副作用：发起 POST /notes 或 PUT /notes/{uid}
 */
export async function submitNote(
  draft: NoteEditorFormDraft,
  publishAction: NotePublishAction,
  existingUid?: NoteResourceUid,
) {
  const request = buildUpsertNoteRequest(draft, publishAction)
  if (existingUid) {
    return updateNote(existingUid, request)
  }
  return createNote(request)
}

// 06）判断编辑表单是否为空（isNoteEditorFormEmpty）
/**
 * 函数名：isNoteEditorFormEmpty
 * 功能：判断草稿是否无任何有效内容，用于离开守卫等场景。
 */
export function isNoteEditorFormEmpty(draft: NoteEditorFormDraft): boolean {
  return (
    !draft.title.trim()
    && !draft.summary.trim()
    && !draft.bodyMarkdown.trim()
    && !draft.videoDescription.trim()
  )
}
