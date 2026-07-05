// 01）笔记封面上传 Hook（useNoteCoverUpload）
import { useCallback, useState } from 'react'
import { NotesApiError, uploadNoteCover } from '@entities/note/api/noteApi'
import { autoGenerateNoteCoverFile } from '@shared/lib/note-cover-generator'
import {
  isRemoteAssetUrl,
  resolvePreviewUrlBlob,
  uploadCoverBeforeSubmit,
  type NoteCoverUploadSource,
  type UploadCoverBeforeSubmitInput,
} from '../lib/noteCoverUploadUtils'

// 02）Hook 参数（UseNoteCoverUploadOptions）
export interface UseNoteCoverUploadOptions {
  onError?: (message: string) => void
}

// 03）Hook 返回值（UseNoteCoverUploadResult）
export interface UseNoteCoverUploadResult {
  isUploading: boolean
  uploadCoverFile: (
    file: File | Blob,
    source?: NoteCoverUploadSource,
    fileName?: string,
  ) => Promise<string | null>
  generateAndUploadAutoCover: (title: string) => Promise<string | null>
  uploadCoverBeforeSubmit: (input: UploadCoverBeforeSubmitInput) => Promise<string | null>
  resolvePreviewUrlBlob: (previewUrl: string) => Promise<Blob>
}

/**
 * 函数名：useNoteCoverUpload
 * 功能：封装笔记封面上传 API（手动上传 / 自动生成 / 提交前补传）。
 * 实现方法：
 * - uploadCoverFile 调用 entities/note uploadNoteCover
 * - generateAndUploadAutoCover 复用 shared/lib/note-cover-generator 生成后按 auto 来源上传
 * - uploadCoverBeforeSubmit 复用 noteCoverUploadUtils 提交前逻辑
 * 输入：
 * - options.onError：失败回调
 * 输出：
 * - 返回值：上传状态与方法
 * - 副作用：发起 POST /uploads/note-cover
 */
export function useNoteCoverUpload(options?: UseNoteCoverUploadOptions): UseNoteCoverUploadResult {
  const [isUploading, setIsUploading] = useState(false)

  const handleError = useCallback(
    (error: unknown, fallback: string): null => {
      if (error instanceof NotesApiError) {
        options?.onError?.(error.message)
      } else if (error instanceof Error) {
        options?.onError?.(error.message)
      } else {
        options?.onError?.(fallback)
      }
      return null
    },
    [options],
  )

  const uploadCoverFile = useCallback(
    async (
      file: File | Blob,
      source: NoteCoverUploadSource = 'upload',
      fileName = 'note-cover.jpg',
    ): Promise<string | null> => {
      setIsUploading(true)
      try {
        const uploaded = await uploadNoteCover(file, source, fileName)
        const coverUrl = uploaded.coverUrl?.trim()
        if (!coverUrl) {
          return handleError(null, '封面上传未返回封面地址')
        }
        return coverUrl
      } catch (error) {
        return handleError(error, '封面上传失败')
      } finally {
        setIsUploading(false)
      }
    },
    [handleError],
  )

  const generateAndUploadAutoCover = useCallback(
    async (title: string): Promise<string | null> => {
      setIsUploading(true)
      try {
        const coverFile = autoGenerateNoteCoverFile(title)
        return await uploadCoverFile(coverFile, 'auto', coverFile.name)
      } catch (error) {
        return handleError(error, '自动生成封面失败')
      } finally {
        setIsUploading(false)
      }
    },
    [handleError, uploadCoverFile],
  )

  const uploadCoverBeforeSubmitHandler = useCallback(
    async (input: UploadCoverBeforeSubmitInput): Promise<string | null> => {
      setIsUploading(true)
      try {
        return await uploadCoverBeforeSubmit(input)
      } catch (error) {
        return handleError(error, '封面上传失败')
      } finally {
        setIsUploading(false)
      }
    },
    [handleError],
  )

  return {
    isUploading,
    uploadCoverFile,
    generateAndUploadAutoCover,
    uploadCoverBeforeSubmit: uploadCoverBeforeSubmitHandler,
    resolvePreviewUrlBlob,
  }
}

export { isRemoteAssetUrl, resolvePreviewUrlBlob }
export type { NoteCoverUploadSource, UploadCoverBeforeSubmitInput }
