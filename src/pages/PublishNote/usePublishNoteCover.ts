import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PublishNoteContentType } from './publishNotePageData'
import { captureVideoFirstFrameDataUrl, generateSummaryCoverDataUrl } from './utils/coverPreview'

// 01）封面来源类型（PublishNoteCoverSource）
export type PublishNoteCoverSource = 'auto' | 'upload'

// 02）笔记封面模型（PublishNoteCoverModel）
export interface PublishNoteCoverModel {
  source: PublishNoteCoverSource
  autoPreviewUrl: string | null
  uploadPreviewUrl: string | null
  activePreviewUrl: string | null
  setSource: (source: PublishNoteCoverSource) => void
  handleSelectCoverImage: (file: File) => void
  clearUploadCover: () => void
}

interface UsePublishNoteCoverOptions {
  contentType: PublishNoteContentType
  summary: string
  title: string
  videoPreviewUrl: string | null
}

// 03）笔记封面 Hook（usePublishNoteCover）
/**
 * 函数名：usePublishNoteCover
 * 功能：管理发布笔记封面的系统生成与用户上传两种来源及预览 URL。
 * 实现方法：
 * - 图文模式：摘要变化时用 Canvas 生成封面
 * - 视频模式：视频预览 URL 变化时截取首帧
 * - 用户上传：Object URL 管理
 * 输入：
 * - options：内容类型、摘要、标题、视频预览地址
 * 输出：
 * - 返回值：PublishNoteCoverModel
 * - 副作用：创建/释放 Object URL；异步截取视频帧
 */
export function usePublishNoteCover(options: UsePublishNoteCoverOptions): PublishNoteCoverModel {
  const { contentType, summary, title, videoPreviewUrl } = options
  const [source, setSource] = useState<PublishNoteCoverSource>('auto')
  const [autoPreviewUrl, setAutoPreviewUrl] = useState<string | null>(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)

  const isVideoNote = contentType === '视频'

  const clearUploadCover = useCallback((): void => {
    setUploadPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return null
    })
  }, [])

  useEffect(() => {
    return () => {
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl)
      }
    }
  }, [uploadPreviewUrl])

  useEffect(() => {
    let isCancelled = false

    async function refreshAutoCover(): Promise<void> {
      if (isVideoNote) {
        if (!videoPreviewUrl) {
          setAutoPreviewUrl(null)
          return
        }

        try {
          const frameUrl = await captureVideoFirstFrameDataUrl(videoPreviewUrl)
          if (!isCancelled) {
            setAutoPreviewUrl(frameUrl)
          }
        } catch {
          if (!isCancelled) {
            setAutoPreviewUrl(null)
          }
        }
        return
      }

      const generatedUrl = generateSummaryCoverDataUrl(summary, title)
      if (!isCancelled) {
        setAutoPreviewUrl(generatedUrl || null)
      }
    }

    void refreshAutoCover()

    return () => {
      isCancelled = true
    }
  }, [isVideoNote, summary, title, videoPreviewUrl])

  const handleSelectCoverImage = (file: File): void => {
    if (!file.type.startsWith('image/')) {
      return
    }

    setSource('upload')
    setUploadPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return URL.createObjectURL(file)
    })
  }

  const activePreviewUrl = useMemo<string | null>(() => {
    if (source === 'upload') {
      return uploadPreviewUrl
    }
    return autoPreviewUrl
  }, [source, uploadPreviewUrl, autoPreviewUrl])

  return {
    source,
    autoPreviewUrl,
    uploadPreviewUrl,
    activePreviewUrl,
    setSource,
    handleSelectCoverImage,
    clearUploadCover,
  }
}
