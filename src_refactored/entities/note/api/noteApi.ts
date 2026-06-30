import { HttpApiError, getApi, postApi, putApi } from '../../../shared/api/http'
import type { NoteResourceUid } from '../../../shared/api/resourceUid'
import type {
  NoteDetailDto,
  UpsertNoteRequest,
  UpsertNoteResponse,
} from '../model/types'

// 01）笔记接口异常类型（NotesApiError）
export class NotesApiError extends HttpApiError {}

// 02）笔记请求封装（wrapNotesApi）
async function wrapNotesApi<TData>(request: () => Promise<TData>): Promise<TData> {
  try { return await request() }
  catch (error) {
    if (error instanceof HttpApiError) throw new NotesApiError(error.code, error.message)
    throw error
  }
}

// 03）查询笔记详情（getNoteDetail）
export async function getNoteDetail(noteUid: NoteResourceUid): Promise<NoteDetailDto> {
  return wrapNotesApi(() => getApi<NoteDetailDto>(`/notes/${noteUid}`))
}

// 04）创建笔记（createNote）
export async function createNote(payload: UpsertNoteRequest): Promise<UpsertNoteResponse> {
  return wrapNotesApi(() => postApi<UpsertNoteRequest, UpsertNoteResponse>('/notes', payload))
}

// 05）更新笔记（updateNote）
export async function updateNote(noteUid: NoteResourceUid, payload: UpsertNoteRequest): Promise<UpsertNoteResponse> {
  return wrapNotesApi(() => putApi<UpsertNoteRequest, UpsertNoteResponse>(`/notes/${noteUid}`, payload))
}
