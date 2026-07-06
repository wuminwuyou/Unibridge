import { HttpApiError, getApi, postApi, putApi, postFormDataApi, httpClient } from '../../../shared/api/http'
import type { NoteResourceUid } from '../../../shared/api/resourceUid'
import type {
  NoteDetailDto,
  NoteCoverUploadResponse,
  NoteVideoUploadResponse,
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

// 07）视频上传选项（UploadNoteVideoOptions）
export interface UploadNoteVideoOptions {
  onProgress?: (progress: number) => void
}

// 08）上传笔记视频（uploadNoteVideo）
/**
 * 函数名：uploadNoteVideo
 * 功能：将视频 File 通过 POST /uploads/note-video 上传并返回远程 URL 与时长。
 * 实现方法：
 * - FormData 携带 file 字段
 * - 通过 onUploadProgress 上报进度
 * - 兼容多种后端响应字段命名
 * 输入：
 * - file：视频 File
 * - options.onProgress：上传进度 0–100，可选
 * 输出：
 * - 返回值：Promise<NoteVideoUploadResponse>
 * - 副作用：发起 POST /uploads/note-video
 */
export async function uploadNoteVideo(
  file: File,
  options?: UploadNoteVideoOptions,
): Promise<NoteVideoUploadResponse> {
  return wrapNotesApi(async () => {
    const formData = new FormData()
    formData.append('file', file)

    const data = await httpClient.post<unknown, unknown>('/uploads/note-video', formData, {
      timeout: 300_000,
      onUploadProgress: (event) => {
        if (event.total && options?.onProgress) {
          options.onProgress(Math.round((event.loaded / event.total) * 100))
        }
      },
    })

    if (typeof data === 'string') {
      return { videoUrl: data, videoDuration: 0 }
    }

    const obj = data as Record<string, unknown>
    const videoUrl = String(obj?.videoUrl ?? obj?.url ?? '')
    const videoDuration = Number(obj?.videoDuration ?? obj?.duration ?? 0)
    const coverUrl = obj?.coverUrl ? String(obj.coverUrl) : undefined

    return {
      videoUrl,
      videoDuration: Number.isFinite(videoDuration) ? Math.round(videoDuration) : 0,
      coverUrl,
    }
  })
}
