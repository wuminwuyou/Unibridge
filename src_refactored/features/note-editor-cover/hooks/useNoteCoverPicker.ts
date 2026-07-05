// 01）封面选择 Hook（useNoteCoverPicker）
import { useCallback, useEffect, useMemo, useState } from 'react'

// 02）封面来源类型（NoteCoverSource）
export type NoteCoverSource = 'auto' | 'upload'

// 03）判断是否为远程 URL（isRemoteAssetUrl）
function isRemoteAssetUrl(url: string | null | undefined): url is string {
  return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')))
}

// 04）封面选择 Hook 参数（UseNoteCoverPickerOptions）
export interface UseNoteCoverPickerOptions {
  /** 已持久化到服务端的远程封面 URL（编辑态初始图，仅 auto 模式展示） */
  coverUrl?: string | null
  /** 初始来源模式 */
  initialSource?: NoteCoverSource
}

// 05）封面选择 Hook 返回值（UseNoteCoverPickerResult）
export interface UseNoteCoverPickerResult {
  source: NoteCoverSource
  setSource: (source: NoteCoverSource) => void
  autoPreviewUrl: string | null
  uploadPreviewUrl: string | null
  activePreviewUrl: string | null
  selectedFile: File | null
  hasLocalCover: boolean
  handleSelectFile: (file: File) => void
  handleSetAutoCoverFile: (file: File) => void
  clearUpload: () => void
  clearAfterSubmit: () => void
  reset: () => void
}

/**
 * 函数名：useNoteCoverPicker
 * 功能：管理笔记封面选择 UI 状态（自动生成 / 手动上传），auto 与 upload 预览互不干扰，不发起 API。
 * 实现方法：
 * - auto / upload 各自维护 preview Object URL 与 File
 * - activePreviewUrl 按当前 source 计算；upload 模式不回退到 auto 或远程图
 * - persistedRemoteUrl 仅用于 auto 模式且无本地生成图时的初始展示
 * 输入：
 * - options.coverUrl：父级已持久化的远程封面
 * - options.initialSource：默认 auto
 * 输出：
 * - 返回值：封面 UI 状态与 handlers
 * - 副作用：创建/释放 Object URL
 */
export function useNoteCoverPicker(options: UseNoteCoverPickerOptions = {}): UseNoteCoverPickerResult {
  const { coverUrl = null, initialSource = 'auto' } = options
  const persistedRemoteUrl = isRemoteAssetUrl(coverUrl) ? coverUrl : null

  const [source, setSource] = useState<NoteCoverSource>(initialSource)
  const [autoPreviewUrl, setAutoPreviewUrl] = useState<string | null>(null)
  const [autoSelectedFile, setAutoSelectedFile] = useState<File | null>(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)
  const [uploadSelectedFile, setUploadSelectedFile] = useState<File | null>(null)

  const clearAuto = useCallback((): void => {
    setAutoPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return null
    })
    setAutoSelectedFile(null)
  }, [])

  const clearUpload = useCallback((): void => {
    setUploadPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return null
    })
    setUploadSelectedFile(null)
  }, [])

  const clearAfterSubmit = useCallback((): void => {
    clearAuto()
    clearUpload()
  }, [clearAuto, clearUpload])

  const reset = useCallback((): void => {
    clearAfterSubmit()
    setSource(initialSource)
  }, [clearAfterSubmit, initialSource])

  useEffect(() => {
    return () => {
      if (autoPreviewUrl) {
        URL.revokeObjectURL(autoPreviewUrl)
      }
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl)
      }
    }
  }, [autoPreviewUrl, uploadPreviewUrl])

  const handleSetAutoCoverFile = useCallback((file: File): void => {
    if (!file.type.startsWith('image/')) {
      return
    }
    setSource('auto')
    setAutoSelectedFile(file)
    setAutoPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return URL.createObjectURL(file)
    })
  }, [])

  const handleSelectFile = useCallback((file: File): void => {
    if (!file.type.startsWith('image/')) {
      return
    }
    setSource('upload')
    setUploadSelectedFile(file)
    setUploadPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return URL.createObjectURL(file)
    })
  }, [])

  const activePreviewUrl = useMemo((): string | null => {
    if (source === 'upload') {
      return uploadPreviewUrl
    }
    return autoPreviewUrl ?? persistedRemoteUrl
  }, [autoPreviewUrl, persistedRemoteUrl, source, uploadPreviewUrl])

  const selectedFile = useMemo((): File | null => {
    return source === 'upload' ? uploadSelectedFile : autoSelectedFile
  }, [autoSelectedFile, source, uploadSelectedFile])

  const hasLocalCover = Boolean(
    autoPreviewUrl || autoSelectedFile || uploadPreviewUrl || uploadSelectedFile,
  )

  return {
    source,
    setSource,
    autoPreviewUrl,
    uploadPreviewUrl,
    activePreviewUrl,
    selectedFile,
    hasLocalCover,
    handleSelectFile,
    handleSetAutoCoverFile,
    clearUpload,
    clearAfterSubmit,
    reset,
  }
}
