// 01）封面上传工具（noteCoverUploadUtils）
import { NotesApiError, uploadNoteCover } from '@entities/note/api/noteApi'

// 02）封面来源（NoteCoverUploadSource）
export type NoteCoverUploadSource = 'auto' | 'upload'

// 03）判断是否为远程 URL（isRemoteAssetUrl）
export function isRemoteAssetUrl(url: string | null | undefined): url is string {
  return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')))
}

// 03）预览 URL 转 Blob（resolvePreviewUrlBlob）
/**
 * 函数名：resolvePreviewUrlBlob
 * 功能：将 blob:/data: 预览地址转为可上传的 Blob。
 * 输入：
 * - previewUrl：本地或远程预览地址
 * 输出：
 * - 返回值：Blob
 * - 副作用：可能发起 fetch
 */
export async function resolvePreviewUrlBlob(previewUrl: string): Promise<Blob> {
  const response = await fetch(previewUrl)
  return response.blob()
}

// 04）提交前上传封面参数（UploadCoverBeforeSubmitInput）
export interface UploadCoverBeforeSubmitInput {
  source: NoteCoverUploadSource
  activePreviewUrl: string | null
  selectedFile: File | null
  persistedCoverUrl?: string | null
}

// 05）提交前上传封面（uploadCoverBeforeSubmit）
/**
 * 函数名：uploadCoverBeforeSubmit
 * 功能：在 create/update 笔记前，将当前封面预览上传至 /uploads/note-cover。
 * 实现方法：
 * - 远程 URL 与上次持久化一致时复用
 * - 否则从 previewUrl / selectedFile 构造 Blob 后上传
 * 输入：
 * - input：封面来源、预览 URL、已选文件、已持久化 URL
 * 输出：
 * - 返回值：coverUrl
 * - 副作用：发起 POST /uploads/note-cover
 */
export async function uploadCoverBeforeSubmit(input: UploadCoverBeforeSubmitInput): Promise<string> {
  const { source, activePreviewUrl, selectedFile, persistedCoverUrl } = input

  if (isRemoteAssetUrl(activePreviewUrl) && activePreviewUrl === persistedCoverUrl) {
    return activePreviewUrl
  }

  if (isRemoteAssetUrl(persistedCoverUrl) && !activePreviewUrl && !selectedFile) {
    return persistedCoverUrl
  }

  if (selectedFile) {
    const uploaded = await uploadNoteCover(selectedFile, source === 'auto' ? 'auto' : 'upload', selectedFile.name)
    const coverUrl = uploaded.coverUrl?.trim()
    if (!coverUrl) {
      throw new NotesApiError(400, '封面上传未返回封面地址')
    }
    return coverUrl
  }

  if (!activePreviewUrl) {
    throw new Error('请配置笔记封面')
  }

  const blob = await resolvePreviewUrlBlob(activePreviewUrl)
  const uploaded = await uploadNoteCover(blob, source === 'auto' ? 'auto' : 'upload')
  const coverUrl = uploaded.coverUrl?.trim()
  if (!coverUrl) {
    throw new NotesApiError(400, '封面上传未返回封面地址')
  }
  return coverUrl
}
