// 01）笔记视频上传 Hook（useNoteVideoUpload）
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { NotesApiError, uploadNoteVideo } from '@entities/note/api/noteApi'
import { readVideoDurationFromFile } from '@shared/lib/readVideoDuration'
import {
  isLocalVideoPreviewUrl,
  isValidVideoHttpUrl,
  normalizeVideoUploadResponse,
  uploadVideoBeforeSubmit,
  validateNoteVideoFile,
  type NoteVideoSourceMode,
  type UploadVideoBeforeSubmitInput,
  type UploadVideoBeforeSubmitResult,
} from '../lib/noteVideoUploadUtils'
import { isRemoteAssetUrl } from '../lib/noteCoverUploadUtils'
import {
  releaseBlobUrl,
  retainBlobUrl,
  revokeBlobUrlIfNotRetained,
} from '@shared/lib/retainedBlobRegistry'

// 02）预览恢复选项（RestoreVideoPreviewOptions）
export interface RestoreVideoPreviewOptions {
  fileName?: string | null
  mode?: NoteVideoSourceMode
}

// 03）Hook 参数（UseNoteVideoUploadOptions）
export interface UseNoteVideoUploadOptions {
  initialVideoUrl?: string
  initialVideoDuration?: number
  /** 为 true 时卸载不 revoke blob（预览跳转后需保留本地视频 URL） */
  preserveBlobOnUnmountRef?: RefObject<boolean>
  onVideoApplied?: (videoUrl: string, videoDuration?: number) => void
  onCoverFromVideo?: (coverUrl: string) => void
  onError?: (message: string) => void
}

// 04）Hook 返回值（UseNoteVideoUploadResult）
export interface UseNoteVideoUploadResult {
  mode: NoteVideoSourceMode
  setMode: (mode: NoteVideoSourceMode) => void
  urlInput: string
  setUrlInput: (value: string) => void
  previewUrl: string | null
  selectedFile: File | null
  selectedFileName: string | null
  persistedVideoUrl: string | null
  isUploading: boolean
  uploadProgress: number
  error: string | null
  selectFile: (file: File) => Promise<void>
  confirmUrl: () => Promise<void>
  clear: () => void
  applyRemoteUrl: (url: string, videoDuration?: number) => void
  restorePreview: (url: string, options?: RestoreVideoPreviewOptions) => void
  uploadVideoBeforeSubmit: (input: UploadVideoBeforeSubmitInput) => Promise<UploadVideoBeforeSubmitResult | null>
  hasLocalVideo: boolean
}

/**
 * 函数名：useNoteVideoUpload
 * 功能：封装视频笔记编辑页的视频源选择、本地预览、上传与提交前补传。
 * 实现方法：
 * - 文件模式：校验 → blob 预览 → 读取时长 → 回调 onVideoApplied
 * - 链接模式：校验 http(s) URL → 回调 onVideoApplied
 * - uploadVideoBeforeSubmit 复用 noteVideoUploadUtils
 * 输入：
 * - options：初始 URL、回调与错误处理
 * 输出：
 * - 返回值：模式、预览状态、上传方法与提交前上传
 * - 副作用：创建/释放 blob URL；可能发起 POST /uploads/note-video
 */
export function useNoteVideoUpload(options?: UseNoteVideoUploadOptions): UseNoteVideoUploadResult {
  const blobUrlRef = useRef<string | null>(null)
  const onErrorRef = useRef(options?.onError)
  onErrorRef.current = options?.onError

  const initialUrl = options?.initialVideoUrl?.trim() ?? ''
  const initialIsRemote = isRemoteAssetUrl(initialUrl)

  const [mode, setModeState] = useState<NoteVideoSourceMode>(() =>
    initialIsRemote ? 'url' : 'file',
  )
  const [urlInput, setUrlInput] = useState(() => (initialIsRemote ? initialUrl : ''))
  const [previewUrl, setPreviewUrl] = useState<string | null>(() =>
    initialUrl.length > 0 ? initialUrl : null,
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [persistedVideoUrl, setPersistedVideoUrl] = useState<string | null>(() =>
    initialIsRemote ? initialUrl : null,
  )
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const revokeBlobUrl = useCallback((): void => {
    if (blobUrlRef.current) {
      releaseBlobUrl(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  const applyPreview = useCallback(
    (nextPreviewUrl: string | null, file: File | null, fileName: string | null): void => {
      if (blobUrlRef.current && blobUrlRef.current !== nextPreviewUrl) {
        releaseBlobUrl(blobUrlRef.current)
      }

      if (nextPreviewUrl?.startsWith('blob:')) {
        retainBlobUrl(nextPreviewUrl)
      }

      blobUrlRef.current = nextPreviewUrl?.startsWith('blob:') ? nextPreviewUrl : null
      setPreviewUrl(nextPreviewUrl)
      setSelectedFile(file)
      setSelectedFileName(fileName)
      if (nextPreviewUrl && isRemoteAssetUrl(nextPreviewUrl)) {
        setPersistedVideoUrl(nextPreviewUrl)
      }
    },
    [],
  )

  const handleError = useCallback((message: string): void => {
    setError(message)
    onErrorRef.current?.(message)
  }, [])

  const setMode = useCallback((nextMode: NoteVideoSourceMode): void => {
    setError(null)
    setModeState(nextMode)
  }, [])

  const selectFile = useCallback(
    async (file: File): Promise<void> => {
      setError(null)
      const validationError = validateNoteVideoFile(file)
      if (validationError) {
        handleError(validationError)
        return
      }

      const objectUrl = URL.createObjectURL(file)
      retainBlobUrl(objectUrl)
      const duration = await readVideoDurationFromFile(file)
      applyPreview(objectUrl, file, file.name)
      options?.onVideoApplied?.(objectUrl, duration || options.initialVideoDuration)
    },
    [applyPreview, handleError, options],
  )

  const confirmUrl = useCallback(async (): Promise<void> => {
    setError(null)
    const trimmed = urlInput.trim()
    if (!trimmed) {
      handleError('请输入视频链接')
      return
    }
    if (!isValidVideoHttpUrl(trimmed)) {
      handleError('请输入有效的 http(s) 视频链接')
      return
    }

    applyPreview(trimmed, null, null)
    setPersistedVideoUrl(trimmed)
    options?.onVideoApplied?.(trimmed, options.initialVideoDuration)
  }, [applyPreview, handleError, options, urlInput])

  const clear = useCallback((): void => {
    setError(null)
    revokeBlobUrl()
    setPreviewUrl(null)
    setSelectedFile(null)
    setSelectedFileName(null)
    setPersistedVideoUrl(null)
    setUrlInput('')
    setUploadProgress(0)
    options?.onVideoApplied?.('', undefined)
  }, [options, revokeBlobUrl])

  const applyRemoteUrl = useCallback(
    (url: string, videoDuration?: number): void => {
      const trimmed = url.trim()
      if (!trimmed) {
        return
      }
      setError(null)
      setModeState('url')
      setUrlInput(trimmed)
      applyPreview(trimmed, null, null)
      setPersistedVideoUrl(trimmed)
      options?.onVideoApplied?.(trimmed, videoDuration)
    },
    [applyPreview, options],
  )

  const restorePreview = useCallback((url: string, restoreOptions?: RestoreVideoPreviewOptions): void => {
    const trimmed = url.trim()
    if (!trimmed) {
      return
    }

    setError(null)
    const isRemote = isRemoteAssetUrl(trimmed)
    const nextMode = restoreOptions?.mode ?? (isRemote ? 'url' : 'file')
    setModeState(nextMode)

    if (isRemote) {
      setUrlInput(trimmed)
      setPersistedVideoUrl(trimmed)
    }

    blobUrlRef.current = trimmed.startsWith('blob:') ? trimmed : null
    if (trimmed.startsWith('blob:')) {
      retainBlobUrl(trimmed)
    }
    setPreviewUrl(trimmed)
    setSelectedFile(null)
    setSelectedFileName(restoreOptions?.fileName ?? null)
  }, [])

  const uploadVideoBeforeSubmitHandler = useCallback(
    async (input: UploadVideoBeforeSubmitInput): Promise<UploadVideoBeforeSubmitResult | null> => {
      setIsUploading(true)
      setUploadProgress(0)
      try {
        const needsUpload = isLocalVideoPreviewUrl(input.draftVideoUrl) && input.selectedFile
        if (needsUpload) {
          const uploaded = await uploadNoteVideo(input.selectedFile!, {
            onProgress: setUploadProgress,
          })
          const normalized = normalizeVideoUploadResponse(uploaded)
          if (normalized.coverUrl) {
            options?.onCoverFromVideo?.(normalized.coverUrl)
          }
          setPersistedVideoUrl(normalized.videoUrl)
          return normalized
        }

        const result = await uploadVideoBeforeSubmit(input, setUploadProgress)
        if (result?.coverUrl) {
          options?.onCoverFromVideo?.(result.coverUrl)
        }
        if (result?.videoUrl && isRemoteAssetUrl(result.videoUrl)) {
          setPersistedVideoUrl(result.videoUrl)
        }
        return result
      } catch (uploadError) {
        if (uploadError instanceof NotesApiError) {
          handleError(uploadError.message)
        } else if (uploadError instanceof Error) {
          handleError(uploadError.message)
        } else {
          handleError('视频上传失败')
        }
        return null
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [handleError, options],
  )

  // 从 session 恢复 blob 预览时登记 ref，便于后续正确释放
  useEffect(() => {
    if (initialUrl.startsWith('blob:')) {
      blobUrlRef.current = initialUrl
      retainBlobUrl(initialUrl)
    }
    // 仅挂载时根据 initialVideoUrl 登记一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => {
    if (options?.preserveBlobOnUnmountRef?.current) {
      return
    }
    if (blobUrlRef.current) {
      revokeBlobUrlIfNotRetained(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [options?.preserveBlobOnUnmountRef])

  const hasLocalVideo = Boolean(
    previewUrl?.trim()
    || selectedFile
    || persistedVideoUrl
    || isLocalVideoPreviewUrl(options?.initialVideoUrl),
  )

  return {
    mode,
    setMode,
    urlInput,
    setUrlInput,
    previewUrl,
    selectedFile,
    selectedFileName,
    persistedVideoUrl,
    isUploading,
    uploadProgress,
    error,
    selectFile,
    confirmUrl,
    clear,
    applyRemoteUrl,
    restorePreview,
    uploadVideoBeforeSubmit: uploadVideoBeforeSubmitHandler,
    hasLocalVideo,
  }
}

export type { NoteVideoSourceMode, UploadVideoBeforeSubmitInput, UploadVideoBeforeSubmitResult }
