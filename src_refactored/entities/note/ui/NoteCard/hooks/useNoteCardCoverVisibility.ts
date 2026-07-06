// 01）笔记卡片封面可见性 Hook（useNoteCardCoverVisibility）
import { useEffect, useState } from 'react'
import { isNoteCoverDisplayable } from '@shared/lib/noteCoverSentinel'

// 02）封面加载失败时的展示策略（NoteCardCoverFailureMode）
export type NoteCardCoverFailureMode = 'hide' | 'placeholder'

// 03）Hook 参数（UseNoteCardCoverVisibilityOptions）
export interface UseNoteCardCoverVisibilityOptions {
  /** hide：加载失败或无 URL 时不渲染封面区；placeholder：保留占位容器 */
  onLoadFailure?: NoteCardCoverFailureMode
}

// 04）Hook 返回值（UseNoteCardCoverVisibilityResult）
export interface UseNoteCardCoverVisibilityResult {
  shouldRenderCover: boolean
  showPlaceholder: boolean
  coverSrc: string | null
  isCoverLoading: boolean
}

// 05）封面图片探测结果（CoverImageProbeResult）
type CoverImageProbeResult = 'loaded' | 'error'

// 06）探测封面是否可加载（probeCoverImageLoad）
/**
 * 函数名：probeCoverImageLoad
 * 功能：探测封面 URL 是否可被浏览器解码展示（含 304 / 磁盘缓存场景）。
 * 实现方法：
 * - 使用 Image 预加载并监听 load / error
 * - src 赋值后检查 complete + naturalWidth，避免缓存命中时不触发 load
 * 输入：
 * - url：封面 URL
 * 输出：
 * - 返回值：Promise<'loaded' | 'error'>
 * - 副作用：发起图片请求（可能走缓存 / 304）
 */
function probeCoverImageLoad(url: string): Promise<CoverImageProbeResult> {
  return new Promise((resolve) => {
    const image = new Image()
    image.decoding = 'async'

    let settled = false

    const finalize = (result: CoverImageProbeResult): void => {
      if (settled) {
        return
      }
      settled = true
      image.removeEventListener('load', handleLoad)
      image.removeEventListener('error', handleError)
      resolve(result)
    }

    const handleLoad = (): void => {
      finalize('loaded')
    }

    const handleError = (): void => {
      finalize('error')
    }

    image.addEventListener('load', handleLoad)
    image.addEventListener('error', handleError)
    image.src = url

    if (image.complete) {
      finalize(image.naturalWidth > 0 ? 'loaded' : 'error')
    }
  })
}

// 07）笔记卡片封面可见性 Hook（useNoteCardCoverVisibility）
/**
 * 函数名：useNoteCardCoverVisibility
 * 功能：根据封面 URL 与图片预加载结果，决定卡片是否渲染封面区域。
 * 实现方法：
 * - 空 URL / 占位 URL：hide 模式不渲染；placeholder 模式展示占位
 * - 有效 URL：probeCoverImageLoad 预加载；成功后才在 hide 模式挂载封面
 * 输入：
 * - coverUrl：笔记封面 URL
 * - options.onLoadFailure：失败策略，默认 hide
 * 输出：
 * - 返回值：shouldRenderCover / showPlaceholder / coverSrc / isCoverLoading
 * - 副作用：创建 Image 预加载
 */
export function useNoteCardCoverVisibility(
  coverUrl: string | null | undefined,
  options: UseNoteCardCoverVisibilityOptions = {},
): UseNoteCardCoverVisibilityResult {
  const onLoadFailure = options.onLoadFailure ?? 'hide'
  const displayableUrl = isNoteCoverDisplayable(coverUrl) ? coverUrl!.trim() : null
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')

  useEffect(() => {
    if (!displayableUrl) {
      setLoadState('idle')
      return undefined
    }

    let cancelled = false
    setLoadState('loading')

    void probeCoverImageLoad(displayableUrl).then((result) => {
      if (!cancelled) {
        setLoadState(result)
      }
    })

    return () => {
      cancelled = true
    }
  }, [displayableUrl])

  if (!displayableUrl) {
    if (onLoadFailure === 'placeholder') {
      return {
        shouldRenderCover: true,
        showPlaceholder: true,
        coverSrc: null,
        isCoverLoading: false,
      }
    }

    return {
      shouldRenderCover: false,
      showPlaceholder: false,
      coverSrc: null,
      isCoverLoading: false,
    }
  }

  if (loadState === 'loaded') {
    return {
      shouldRenderCover: true,
      showPlaceholder: false,
      coverSrc: displayableUrl,
      isCoverLoading: false,
    }
  }

  if (loadState === 'error') {
    if (onLoadFailure === 'placeholder') {
      return {
        shouldRenderCover: true,
        showPlaceholder: true,
        coverSrc: null,
        isCoverLoading: false,
      }
    }

    return {
      shouldRenderCover: false,
      showPlaceholder: false,
      coverSrc: null,
      isCoverLoading: false,
    }
  }

  if (onLoadFailure === 'placeholder') {
    return {
      shouldRenderCover: true,
      showPlaceholder: true,
      coverSrc: null,
      isCoverLoading: loadState === 'loading',
    }
  }

  return {
    shouldRenderCover: false,
    showPlaceholder: false,
    coverSrc: null,
    isCoverLoading: loadState === 'loading',
  }
}
