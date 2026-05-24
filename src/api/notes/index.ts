import { HttpApiError, getApi, postApi, putApi } from '../http'
import { normalizeUpsertNoteRequestPayload } from './payload'
import { uploadNoteCoverWithPrecheck, uploadNoteVideoWithPrecheck } from './uploadPrecheck'
import type {
  NoteCoverUploadResponse,
  NoteDetailDto,
  NoteVideoUploadResponse,
  UpsertNoteRequest,
  UpsertNoteResponse,
} from './types'

// 01）笔记接口异常类型（NotesApiError）
export class NotesApiError extends HttpApiError {}

// 02）笔记请求封装（wrapNotesApi）
async function wrapNotesApi<TData>(request: () => Promise<TData>): Promise<TData> {
  try {
    return await request()
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new NotesApiError(error.code, error.message)
    }
    throw error
  }
}

// 03）查询笔记详情（getNoteDetail）
/**
 * 函数名：getNoteDetail
 * 功能：调用 GET /notes/{noteId} 获取笔记详情。
 */
export async function getNoteDetail(noteId: number): Promise<NoteDetailDto> {
  return wrapNotesApi(() => getApi<NoteDetailDto>(`/notes/${noteId}`))
}

// 04）秒传预检（checkUploadByMd5）
export { checkUploadByMd5, resolveInstantUploadUrlByMd5 } from './uploadPrecheck'

// 05）上传笔记封面（uploadNoteCover）
/**
 * 函数名：uploadNoteCover
 * 功能：先 GET /uploads/check-md5 预检，命中则秒传；否则 POST /uploads/note-cover。
 */
export async function uploadNoteCover(
  file: File | Blob,
  source: 'auto' | 'upload' = 'upload',
  fileName = 'note-cover.jpg',
): Promise<NoteCoverUploadResponse> {
  return wrapNotesApi(() => uploadNoteCoverWithPrecheck(file, source, fileName))
}

// 06）上传笔记视频（uploadNoteVideo）
/**
 * 函数名：uploadNoteVideo
 * 功能：先 GET /uploads/check-md5 预检，命中则秒传；否则 POST /uploads/note-video。
 */
export async function uploadNoteVideo(file: File): Promise<NoteVideoUploadResponse> {
  return wrapNotesApi(() => uploadNoteVideoWithPrecheck(file))
}

// 07）创建笔记（createNote）
/**
 * 函数名：createNote
 * 功能：调用 POST /notes 创建笔记（草稿或发布）。
 */
export async function createNote(payload: UpsertNoteRequest): Promise<UpsertNoteResponse> {
  return wrapNotesApi(async () => {
    const body = normalizeUpsertNoteRequestPayload(payload)
    return postApi<UpsertNoteRequest, UpsertNoteResponse>('/notes', body)
  })
}

// 08）更新笔记（updateNote）
/**
 * 函数名：updateNote
 * 功能：调用 PUT /notes/{noteId} 更新笔记。
 */
export async function updateNote(noteId: number, payload: UpsertNoteRequest): Promise<UpsertNoteResponse> {
  return wrapNotesApi(async () => {
    const body = normalizeUpsertNoteRequestPayload(payload)
    return putApi<UpsertNoteRequest, UpsertNoteResponse>(`/notes/${noteId}`, body)
  })
}

export type {
  NoteCoverUploadResponse,
  NoteDetailAuthorDto,
  NoteDetailDto,
  NotePublishAction,
  NoteVideoUploadResponse,
  UpsertNoteRequest,
  UpsertNoteResponse,
} from './types'
