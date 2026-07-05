import { HttpApiError, getApi, postApi, putApi, postFormDataApi } from '../../../shared/api/http'
import type { NoteResourceUid } from '../../../shared/api/resourceUid'
import type {
  NoteDetailDto,
  UpsertNoteRequest,
  UpsertNoteResponse,
} from '../model/types'

// 01）笔记接口异常类型（NotesApiError）
export class NotesApiError extends HttpApiError {}

// 01b）笔记封面上传响应（NoteCoverUploadResponse）
export interface NoteCoverUploadResponse { coverUrl: string }

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

// 06）上传笔记封面（uploadNoteCover）
/**
 * 函数名：uploadNoteCover
 * 功能：将图片 File/Blob 通过 POST /uploads/note-cover 上传并返回封面 URL。
 * 输入：
 * - file：图片 File 或 Blob
 * - source：来源标签（auto / upload），默认 upload
 * - fileName：Blob 转 File 时的文件名
 * 输出：
 * - 返回值：Promise<NoteCoverUploadResponse>
 * - 副作用：发起 POST /uploads/note-cover
 */
export async function uploadNoteCover(
  file: File | Blob,
  source: 'auto' | 'upload' = 'upload',
  fileName = 'note-cover.jpg',
): Promise<NoteCoverUploadResponse> {
  return wrapNotesApi(async () => {
    const uploadFile =
      file instanceof File ? file : new File([file], fileName, { type: file.type || 'image/jpeg' })
    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('source', source)
    const data = await postFormDataApi<unknown>('/uploads/note-cover', formData)
    // 兼容后端 { coverUrl } 或直接返回字符串
    if (typeof data === 'string') {
      return { coverUrl: data }
    }
    const obj = data as Record<string, unknown>
    const coverUrl = String(obj?.coverUrl ?? obj?.url ?? '')
    return { coverUrl }
  })
}
