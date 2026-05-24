import { HttpApiError, getApi, postFormDataApi } from '../http'
import { computeBlobMd5 } from '../../utils/fileMd5'
import { readVideoDurationFromFile } from '../../utils/readVideoDuration'
import {
  normalizeNoteCoverUploadResponse,
  normalizeNoteVideoUploadResponse,
  pickNoteVideoUrlFromUploadData,
} from './payload'
import type { NoteCoverUploadResponse, NoteVideoUploadResponse, UploadMd5CheckResult } from './types'

// 01）校验 MD5 格式（assertValidUploadMd5）
function assertValidUploadMd5(md5: string): string {
  const normalized = md5.trim().toLowerCase()
  if (!/^[a-f0-9]{32}$/.test(normalized)) {
    throw new HttpApiError(400, '无效的文件 MD5')
  }
  return normalized
}

// 02）秒传预检（checkUploadByMd5）
/**
 * 函数名：checkUploadByMd5
 * 功能：调用 GET /uploads/check-md5，判断文件是否已存在可秒传。
 * 输入：
 * - md5：32 位小写十六进制 MD5
 * 输出：
 * - 返回值：exists 与 filePath
 * - 副作用：发起网络请求
 */
export async function checkUploadByMd5(md5: string): Promise<UploadMd5CheckResult> {
  const normalizedMd5 = assertValidUploadMd5(md5)
  return getApi<UploadMd5CheckResult>(`/uploads/check-md5?md5=${encodeURIComponent(normalizedMd5)}`)
}

// 03）秒传预检并解析已有 URL（resolveInstantUploadUrlByMd5）
/**
 * 函数名：resolveInstantUploadUrlByMd5
 * 功能：对 Blob 计算 MD5 并预检；命中则返回已有 filePath，否则返回 null。
 * 输入：
 * - blob：待上传文件
 * 输出：
 * - 返回值：可秒传的 URL 或 null（需走 POST 上传）
 */
export async function resolveInstantUploadUrlByMd5(blob: Blob): Promise<string | null> {
  const md5 = await computeBlobMd5(blob)
  const precheck = await checkUploadByMd5(md5)
  if (!precheck.exists) {
    return null
  }

  const filePath = precheck.filePath?.trim()
  return filePath && filePath.length > 0 ? filePath : null
}

// 04）上传笔记封面（含秒传预检）（uploadNoteCoverWithPrecheck）
/**
 * 函数名：uploadNoteCoverWithPrecheck
 * 功能：先 GET /uploads/check-md5，命中则复用 URL；否则 POST /uploads/note-cover。
 * 输入：
 * - file：封面 Blob 或 File
 * - source：封面来源（仅 form 字段，后端可忽略）
 * - fileName：Blob 转 File 时的文件名
 * 输出：
 * - 返回值：NoteCoverUploadResponse
 */
export async function uploadNoteCoverWithPrecheck(
  file: File | Blob,
  source: 'auto' | 'upload' = 'upload',
  fileName = 'note-cover.jpg',
): Promise<NoteCoverUploadResponse> {
  const uploadFile =
    file instanceof File ? file : new File([file], fileName, { type: file.type || 'image/jpeg' })

  const instantUrl = await resolveInstantUploadUrlByMd5(uploadFile)
  if (instantUrl) {
    return normalizeNoteCoverUploadResponse(instantUrl)
  }

  const formData = new FormData()
  formData.append('file', uploadFile)
  formData.append('source', source)

  const data = await postFormDataApi<unknown>('/uploads/note-cover', formData)
  return normalizeNoteCoverUploadResponse(data)
}

// 05）上传笔记视频（含秒传预检）（uploadNoteVideoWithPrecheck）
/**
 * 函数名：uploadNoteVideoWithPrecheck
 * 功能：先 GET /uploads/check-md5，命中则复用 URL 并由前端解析时长；否则 POST /uploads/note-video。
 * 输入：
 * - file：视频 File
 * 输出：
 * - 返回值：NoteVideoUploadResponse（videoDuration 由本地解析）
 */
export async function uploadNoteVideoWithPrecheck(file: File): Promise<NoteVideoUploadResponse> {
  const instantUrl = await resolveInstantUploadUrlByMd5(file)
  if (instantUrl) {
    const videoUrl = pickNoteVideoUrlFromUploadData(instantUrl) ?? instantUrl
    const videoDuration = await readVideoDurationFromFile(file)
    return { videoUrl, videoDuration }
  }

  const formData = new FormData()
  formData.append('file', file)

  const data = await postFormDataApi<unknown>('/uploads/note-video', formData)
  const uploaded = normalizeNoteVideoUploadResponse(data)

  if (uploaded.videoDuration <= 0) {
    const localDuration = await readVideoDurationFromFile(file)
    return { ...uploaded, videoDuration: localDuration }
  }

  return uploaded
}
