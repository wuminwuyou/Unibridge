// 01）笔记视频上传工具（noteVideoUploadUtils）
import { uploadNoteVideo } from '@entities/note/api/noteApi'
import type { NoteVideoUploadResponse } from '@entities/note/model/types'
import { isRemoteAssetUrl } from './noteCoverUploadUtils'

// 02）视频源模式（NoteVideoSourceMode）
export type NoteVideoSourceMode = 'file' | 'url'

// 03）可接受的视频 MIME / 扩展名（NOTE_VIDEO_ACCEPT）
export const NOTE_VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-msvideo,.mp4,.mov,.webm'

// 04）视频文件大小上限 500MB（NOTE_VIDEO_MAX_BYTES）
export const NOTE_VIDEO_MAX_BYTES = 500 * 1024 * 1024

// 05）校验视频 URL 格式（isValidVideoHttpUrl）
/**
 * 函数名：isValidVideoHttpUrl
 * 功能：判断字符串是否为 http(s) 视频链接。
 * 输入：
 * - url：待校验字符串
 * 输出：
 * - 返回值：boolean
 */
export function isValidVideoHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// 06）判断是否为本地预览 URL（isLocalVideoPreviewUrl）
/**
 * 函数名：isLocalVideoPreviewUrl
 * 功能：判断 videoUrl 是否为 blob/data 本地预览地址。
 * 输入：
 * - url：videoUrl，可选
 * 输出：
 * - 返回值：boolean
 */
export function isLocalVideoPreviewUrl(url: string | undefined): boolean {
  const normalized = url?.trim()
  if (!normalized) {
    return false
  }
  return normalized.startsWith('blob:') || normalized.startsWith('data:')
}

// 07）校验视频文件（validateNoteVideoFile）
/**
 * 函数名：validateNoteVideoFile
 * 功能：校验用户选择的视频文件类型与大小。
 * 输入：
 * - file：File
 * 输出：
 * - 返回值：错误文案；通过时 null
 */
export function validateNoteVideoFile(file: File): string | null {
  if (file.size <= 0) {
    return '视频文件无效'
  }
  if (file.size > NOTE_VIDEO_MAX_BYTES) {
    return '视频文件过大，请选择 500MB 以内的文件'
  }
  const lowerName = file.name.toLowerCase()
  const allowedExt = ['.mp4', '.mov', '.webm', '.m4v']
  const hasAllowedExt = allowedExt.some((ext) => lowerName.endsWith(ext))
  const hasAllowedMime = file.type.startsWith('video/')
  if (!hasAllowedExt && !hasAllowedMime) {
    return '不支持的视频格式，请上传 MP4、MOV 或 WebM'
  }
  return null
}

// 08）提交前视频上传输入（UploadVideoBeforeSubmitInput）
export interface UploadVideoBeforeSubmitInput {
  draftVideoUrl?: string
  selectedFile: File | null
  persistedVideoUrl: string | null
  draftVideoDuration?: number
}

// 09）提交前视频上传结果（UploadVideoBeforeSubmitResult）
export interface UploadVideoBeforeSubmitResult {
  videoUrl: string
  videoDuration: number
  coverUrl?: string
}

// 10）提交前上传视频（uploadVideoBeforeSubmit）
/**
 * 函数名：uploadVideoBeforeSubmit
 * 功能：在 create/update 笔记前，将 blob 本地视频上传至服务端并返回远程 URL。
 * 实现方法：
 * - 若 draft 或 persisted 已有远程 URL，直接返回
 * - 若 draft 为 blob 且存在 selectedFile，调用 uploadNoteVideo
 * 输入：
 * - input：草稿 videoUrl、选中文件、已持久化 URL、时长
 * - onProgress：上传进度回调，可选
 * 输出：
 * - 返回值：远程 videoUrl 与时长；无法上传时 null
 * - 副作用：可能发起 POST /uploads/note-video
 */
export async function uploadVideoBeforeSubmit(
  input: UploadVideoBeforeSubmitInput,
  onProgress?: (progress: number) => void,
): Promise<UploadVideoBeforeSubmitResult | null> {
  const draftUrl = input.draftVideoUrl?.trim()
  if (isRemoteAssetUrl(draftUrl)) {
    return {
      videoUrl: draftUrl,
      videoDuration: input.draftVideoDuration ?? 0,
    }
  }

  if (isRemoteAssetUrl(input.persistedVideoUrl)) {
    return {
      videoUrl: input.persistedVideoUrl,
      videoDuration: input.draftVideoDuration ?? 0,
    }
  }

  if (isLocalVideoPreviewUrl(draftUrl) && input.selectedFile) {
    const uploaded = await uploadNoteVideo(input.selectedFile, { onProgress })
    return normalizeVideoUploadResponse(uploaded)
  }

  if (isValidVideoHttpUrl(draftUrl ?? '')) {
    return {
      videoUrl: draftUrl!,
      videoDuration: input.draftVideoDuration ?? 0,
    }
  }

  return null
}

// 11）规范化视频上传响应（normalizeVideoUploadResponse）
/**
 * 函数名：normalizeVideoUploadResponse
 * 功能：将 API 响应归一为 UploadVideoBeforeSubmitResult。
 * 输入：
 * - response：NoteVideoUploadResponse 或兼容结构
 * 输出：
 * - 返回值：UploadVideoBeforeSubmitResult
 */
export function normalizeVideoUploadResponse(
  response: NoteVideoUploadResponse,
): UploadVideoBeforeSubmitResult {
  return {
    videoUrl: response.videoUrl.trim(),
    videoDuration: response.videoDuration ?? 0,
    coverUrl: response.coverUrl?.trim() || undefined,
  }
}
