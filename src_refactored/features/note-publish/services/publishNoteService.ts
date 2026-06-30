// 01）发布笔记 Feature — Services
import { resolvePublishNoteSummary } from '../../../shared/lib/publishSummary'
import { createNote, updateNote } from '../../../entities/note/api/noteApi'
import type { UpsertNoteRequest, NotePublishAction } from '../../../entities/note/model/types'
import type { NoteResourceUid } from '../../../shared/api/resourceUid'

export type PublishNoteContentType = '文章' | '视频'

// 02）发布笔记表单草稿
export interface PublishNoteFormDraft {
  title: string; summary: string; contentType: PublishNoteContentType
  bodyMarkdown: string; videoDescription: string; tags: string[]
  coverUrl: string; videoUrl?: string; videoDuration?: number
}

// 03）构建笔记请求体
export function buildUpsertNoteRequest(draft: PublishNoteFormDraft, publishAction: NotePublishAction): UpsertNoteRequest {
  const isVideo = draft.contentType === '视频'
  return {
    publishAction, title: draft.title.trim(),
    summary: resolvePublishNoteSummary(draft.summary, draft.contentType, draft.bodyMarkdown, draft.videoDescription),
    contentType: isVideo ? '视频' : '图文',
    content: isVideo ? draft.videoDescription : draft.bodyMarkdown,
    tags: draft.tags, coverUrl: draft.coverUrl,
    videoUrl: draft.videoUrl, videoDuration: draft.videoDuration,
  }
}

// 04）提交笔记
export async function submitNote(draft: PublishNoteFormDraft, publishAction: NotePublishAction, existingUid?: NoteResourceUid) {
  const request = buildUpsertNoteRequest(draft, publishAction)
  if (existingUid) return updateNote(existingUid, request)
  return createNote(request)
}

// 05）判断表单是否为空
export function isPublishNoteFormEmpty(draft: PublishNoteFormDraft): boolean {
  return !draft.title.trim() && !draft.summary.trim() && !draft.bodyMarkdown.trim() && !draft.videoDescription.trim()
}
