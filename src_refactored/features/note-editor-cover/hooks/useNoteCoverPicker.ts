// 01）封面选择 Hook（useNoteCoverPicker）
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'
import {
  cropImageToCoverFile,
  getDefaultCoverCropTransform,
  resolveCoverOutputWidthByAspect,
  type CoverCropTransform,
} from '@shared/lib/cropCoverImage'
import {
  releaseBlobUrl,
  retainBlobUrl,
  revokeBlobUrlIfNotRetained,
} from '@shared/lib/retainedBlobRegistry'

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
  /** 目标封面宽高比（图文 3:4 / 视频 16:9） */
  coverAspect: { width: number; height: number }
  /** 为 true 时卸载不 revoke blob（预览跳转后需保留本地封面 URL） */
  preserveBlobOnUnmountRef?: RefObject<boolean>
}

// 05）设置封面时可选参数（SetCoverFileOptions）
export interface SetCoverFileOptions {
  /** 用于「调整封面」的原始图源 URL（未裁剪上传图或视频原始帧） */
  adjustSourceUrl?: string | null
  /** 当前裁剪变换，默认居中 */
  cropTransform?: CoverCropTransform
}

// 06）封面选择 Hook 返回值（UseNoteCoverPickerResult）
export interface UseNoteCoverPickerResult {
  source: NoteCoverSource
  setSource: (source: NoteCoverSource) => void
  autoPreviewUrl: string | null
  uploadPreviewUrl: string | null
  activePreviewUrl: string | null
  selectedFile: File | null
  hasLocalCover: boolean
  coverAdjustSourceUrl: string | null
  coverCropTransform: CoverCropTransform
  handleSelectFile: (file: File) => Promise<void>
  handleSetAutoCoverFile: (file: File, options?: SetCoverFileOptions) => void
  handleApplyAdjustedCover: (file: File, transform: CoverCropTransform) => void
  clearAuto: () => void
  clearUpload: () => void
  clearAfterSubmit: () => void
  reset: () => void
}

// 07）释放调整源 URL（releaseAdjustSourceUrl）
function releaseAdjustSourceUrl(url: string | null): void {
  if (url && !isRemoteAssetUrl(url)) {
    releaseBlobUrl(url)
  }
}

/**
 * 函数名：useNoteCoverPicker
 * 功能：管理笔记封面选择 UI 状态（自动生成 / 手动上传），auto 与 upload 预览互不干扰，不发起 API。
 * 实现方法：
 * - auto / upload 各自维护 preview Object URL 与 File
 * - 上传或视频帧提取后按 coverAspect 居中裁剪；保留 adjustSourceUrl 供用户二次调整
 * - activePreviewUrl 按当前 source 计算；upload 模式不回退到 auto 或远程图
 * 输入：
 * - options.coverUrl：父级已持久化的远程封面
 * - options.coverAspect：目标宽高比
 * - options.initialSource：默认 auto
 * 输出：
 * - 返回值：封面 UI 状态与 handlers
 * - 副作用：创建/释放 Object URL
 */
export function useNoteCoverPicker(options: UseNoteCoverPickerOptions): UseNoteCoverPickerResult {
  const {
    coverUrl = null,
    initialSource = 'auto',
    coverAspect,
    preserveBlobOnUnmountRef,
  } = options
  const persistedRemoteUrl = isRemoteAssetUrl(coverUrl) ? coverUrl : null

  const [source, setSource] = useState<NoteCoverSource>(initialSource)
  const [autoPreviewUrl, setAutoPreviewUrl] = useState<string | null>(null)
  const [autoSelectedFile, setAutoSelectedFile] = useState<File | null>(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)
  const [uploadSelectedFile, setUploadSelectedFile] = useState<File | null>(null)
  const [adjustSourceUrl, setAdjustSourceUrl] = useState<string | null>(null)
  const [coverCropTransform, setCoverCropTransform] = useState<CoverCropTransform>(
    getDefaultCoverCropTransform(),
  )

  const replacePreviewForSource = useCallback(
    (targetSource: NoteCoverSource, file: File): void => {
      if (targetSource === 'upload') {
        setUploadSelectedFile(file)
        setUploadPreviewUrl((previous) => {
          if (previous) {
            releaseBlobUrl(previous)
          }
          const nextUrl = URL.createObjectURL(file)
          retainBlobUrl(nextUrl)
          return nextUrl
        })
        return
      }

      setAutoSelectedFile(file)
      setAutoPreviewUrl((previous) => {
        if (previous) {
          releaseBlobUrl(previous)
        }
        const nextUrl = URL.createObjectURL(file)
        retainBlobUrl(nextUrl)
        return nextUrl
      })
    },
    [],
  )

  const clearAdjustSource = useCallback((): void => {
    setAdjustSourceUrl((previous) => {
      releaseAdjustSourceUrl(previous)
      return null
    })
    setCoverCropTransform(getDefaultCoverCropTransform())
  }, [])

  const clearAuto = useCallback((): void => {
    setAutoPreviewUrl((previous) => {
      if (previous) {
        releaseBlobUrl(previous)
      }
      return null
    })
    setAutoSelectedFile(null)
    clearAdjustSource()
  }, [clearAdjustSource])

  const clearUpload = useCallback((): void => {
    setUploadPreviewUrl((previous) => {
      if (previous) {
        releaseBlobUrl(previous)
      }
      return null
    })
    setUploadSelectedFile(null)
    clearAdjustSource()
  }, [clearAdjustSource])

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
      if (preserveBlobOnUnmountRef?.current) {
        return
      }
      revokeBlobUrlIfNotRetained(autoPreviewUrl)
      revokeBlobUrlIfNotRetained(uploadPreviewUrl)
      revokeBlobUrlIfNotRetained(adjustSourceUrl)
    }
  }, [adjustSourceUrl, autoPreviewUrl, preserveBlobOnUnmountRef, uploadPreviewUrl])

  const setAdjustSource = useCallback((nextUrl: string | null): void => {
    setAdjustSourceUrl((previous) => {
      if (previous && previous !== nextUrl) {
        releaseAdjustSourceUrl(previous)
      }
      if (nextUrl && !isRemoteAssetUrl(nextUrl)) {
        retainBlobUrl(nextUrl)
      }
      return nextUrl
    })
  }, [])

  const handleSetAutoCoverFile = useCallback((file: File, setOptions?: SetCoverFileOptions): void => {
    if (!file.type.startsWith('image/')) {
      return
    }
    setSource('auto')
    replacePreviewForSource('auto', file)

    if (setOptions?.adjustSourceUrl) {
      setAdjustSource(setOptions.adjustSourceUrl)
    } else {
      setAdjustSource(URL.createObjectURL(file))
    }

    setCoverCropTransform(setOptions?.cropTransform ?? getDefaultCoverCropTransform())
  }, [replacePreviewForSource, setAdjustSource])

  const handleSelectFile = useCallback(async (file: File): Promise<void> => {
    if (!file.type.startsWith('image/')) {
      return
    }

    setSource('upload')

    const originalUrl = URL.createObjectURL(file)
    retainBlobUrl(originalUrl)
    setAdjustSource(originalUrl)

    try {
      const croppedFile = await cropImageToCoverFile(
        originalUrl,
        coverAspect,
        getDefaultCoverCropTransform(),
        resolveCoverOutputWidthByAspect(coverAspect),
        file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') ? file.name : `${file.name.replace(/\.[^.]+$/, '')}-cover.jpg`,
      )
      replacePreviewForSource('upload', croppedFile)
      setCoverCropTransform(getDefaultCoverCropTransform())
    } catch {
      replacePreviewForSource('upload', file)
      setCoverCropTransform(getDefaultCoverCropTransform())
    }
  }, [coverAspect, replacePreviewForSource, setAdjustSource])

  const handleApplyAdjustedCover = useCallback((file: File, transform: CoverCropTransform): void => {
    replacePreviewForSource(source, file)
    setCoverCropTransform(transform)
  }, [replacePreviewForSource, source])

  const activePreviewUrl = useMemo((): string | null => {
    if (source === 'upload') {
      return uploadPreviewUrl
    }
    return autoPreviewUrl ?? persistedRemoteUrl
  }, [autoPreviewUrl, persistedRemoteUrl, source, uploadPreviewUrl])

  const coverAdjustSourceUrl = useMemo((): string | null => {
    return adjustSourceUrl ?? activePreviewUrl
  }, [activePreviewUrl, adjustSourceUrl])

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
    coverAdjustSourceUrl,
    coverCropTransform,
    handleSelectFile,
    handleSetAutoCoverFile,
    handleApplyAdjustedCover,
    clearAuto,
    clearUpload,
    clearAfterSubmit,
    reset,
  }
}
