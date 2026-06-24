import { NotesApiError, updateNote } from '../../../../api/notes'
import type { NotePublishAction, UpsertNoteRequest } from '../../../../api/notes/types'
import { isNoteResourceUid } from '../../../../api/resourceUid'
import type { NoteResourceUid } from '../../../../api/resourceUid'
import type { NoteVideoDetailPayload } from '../types'

// 01）构建视频便捷笔记写请求体（buildVideoQuickNoteUpsertRequest）
/**
 * 函数名：buildVideoQuickNoteUpsertRequest
 * 功能：将视频详情页上下文与便捷笔记 Markdown 组装为 PUT /notes/{uid} 请求体。
 * 实现方法：
 * - 复用笔记标题、摘要、标签、封面、视频等媒体字段
 * - 将编辑器 Markdown 写入 content 字段
 * - TODO：后续接入可见性（如仅自己可见 / 公开），当前沿用服务端默认策略
 * 输入：
 * - note：NoteVideoDetailPayload
 * - markdown：便捷笔记 Markdown
 * - publishAction：DRAFT 或 PUBLISH
 * 输出：
 * - 返回值：UpsertNoteRequest
 * - 副作用：coverUrl 缺失时抛出 NotesApiError
 */
export function buildVideoQuickNoteUpsertRequest(
  note: NoteVideoDetailPayload,
  markdown: string,
  publishAction: NotePublishAction,
): UpsertNoteRequest {
  const coverUrl = note.coverUrl?.trim() ?? ''
  if (!coverUrl) {
    throw new NotesApiError(400, '缺少笔记封面 coverUrl')
  }

  // TODO: 后续实现笔记可见性设置（如 visibility: 'PRIVATE' | 'PUBLIC'），待后端字段与 UI 接入
  return {
    publishAction,
    title: note.title.trim() || '未命名视频笔记',
    summary: note.summary.trim() || '暂无摘要',
    contentType: '视频',
    tags: note.tags,
    coverUrl,
    videoUrl: note.videoUrl.trim(),
    videoDuration: note.videoDuration,
    content: markdown.trim() || null,
  }
}

// 02）校验视频便捷笔记提交（validateVideoQuickNoteSubmit）
/**
 * 函数名：validateVideoQuickNoteSubmit
 * 功能：按 publishAction 校验视频便捷笔记是否满足写接口要求。
 * 输入：
 * - note：NoteVideoDetailPayload
 * - publishAction：DRAFT 或 PUBLISH
 * 输出：
 * - 返回值：错误文案或 null
 */
export function validateVideoQuickNoteSubmit(
  note: NoteVideoDetailPayload,
  publishAction: NotePublishAction,
): string | null {
  if (!note.title.trim()) {
    return '笔记标题缺失，无法保存'
  }

  if (!note.coverUrl?.trim()) {
    return '笔记封面缺失，无法保存'
  }

  if (publishAction === 'DRAFT') {
    return null
  }

  if (note.tags.length === 0) {
    return '请至少添加 1 个话题标签'
  }

  if (!note.videoUrl.trim()) {
    return '视频地址缺失，无法发布'
  }

  return null
}

// 03）提交视频便捷笔记（submitVideoQuickNote）
/**
 * 函数名：submitVideoQuickNote
 * 功能：调用 PUT /notes/{uid} 保存草稿或正式发布视频笔记（含便捷笔记正文）。
 * 实现方法：
 * - 校验表单与 noteUid
 * - buildVideoQuickNoteUpsertRequest 组装请求体
 * - updateNote 写入服务端
 * 输入：
 * - note：视频详情载荷
 * - noteUid：笔记对外 uid
 * - markdown：便捷笔记 Markdown
 * - publishAction：DRAFT 或 PUBLISH
 * 输出：
 * - 返回值：UpsertNoteResponse.uid
 * - 副作用：发起 PUT /notes/{uid}
 */
export async function submitVideoQuickNote(options: {
  note: NoteVideoDetailPayload
  noteUid: NoteResourceUid | null | undefined
  markdown: string
  publishAction: NotePublishAction
}): Promise<NoteResourceUid> {
  const validationError = validateVideoQuickNoteSubmit(options.note, options.publishAction)
  if (validationError) {
    throw new NotesApiError(400, validationError)
  }

  if (!isNoteResourceUid(options.noteUid)) {
    throw new NotesApiError(400, '当前笔记尚未关联服务端 ID，无法保存')
  }

  const payload = buildVideoQuickNoteUpsertRequest(options.note, options.markdown, options.publishAction)
  const response = await updateNote(options.noteUid, payload)
  return response.uid
}
