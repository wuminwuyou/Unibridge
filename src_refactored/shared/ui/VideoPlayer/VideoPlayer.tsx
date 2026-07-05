import Artplayer from 'artplayer'
import { useEffect, useRef } from 'react'
import { useDocumentTheme } from '@shared/hooks/useDocumentTheme'
import pauseIconUrl from './Pause.svg?url'
import './VideoPlayer.css'

// 01）视频播放器 Props（VideoPlayerProps）
export interface VideoPlayerProps {
  videoUrl: string
  posterUrl?: string | null
  /** 无障碍标题（由页面 h1 承担，播放器内不传） */
  title?: string
  className?: string
}

// 02）构建 ArtPlayer 暂停图标 HTML（buildPauseIconHtml）
function buildPauseIconHtml(): string {
  return `<img src="${pauseIconUrl}" class="video-player__pause-icon" width="28" height="28" alt="" />`
}

// 03）通用视频播放器（VideoPlayer）
/**
 * 函数名：VideoPlayer
 * 功能：基于 ArtPlayer 的通用视频播放器，适用于笔记/项目等任意视频场景。
 * 实现方法：
 * - useEffect 挂载 ArtPlayer 实例并绑定 container
 * - 跟随 data-theme 切换明暗主题
 * - 卸载时 destroy 释放资源
 * 输入：
 * - videoUrl：视频地址
 * - posterUrl：封面图，可选
 * - title：无障碍标题
 * 输出：
 * - 返回值：React 节点
 * - 副作用：创建/销毁 ArtPlayer 实例
 */
export function VideoPlayer({ videoUrl, posterUrl, className }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Artplayer | null>(null)
  const theme = useDocumentTheme()
  const trimmedUrl = videoUrl.trim()
  const hasVideo = trimmedUrl.length > 0

  useEffect(() => {
    const container = containerRef.current
    if (!container || !hasVideo) {
      return
    }

    const art = new Artplayer({
      container,
      url: trimmedUrl,
      poster: posterUrl ?? undefined,
      autoplay: false,
      autoSize: false,
      autoMini: false,
      loop: false,
      flip: false,
      playbackRate: true,
      aspectRatio: true,
      setting: true,
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      theme: theme === 'dark' ? '#8cb2ff' : '#215fca',
      lang: navigator.language.toLowerCase().startsWith('zh') ? 'zh-cn' : 'en',
      icons: {
        pause: buildPauseIconHtml(),
      },
    })

    playerRef.current = art

    return () => {
      art.destroy(false)
      playerRef.current = null
    }
  }, [hasVideo, posterUrl, theme, trimmedUrl])

  return (
    <div className={`video-player ${className ?? ''}`.trim()}>
      <div ref={containerRef} className="video-player__container" />
      {!hasVideo ? (
        <div className="video-player__empty" role="status">
          暂无视频源，请稍后再试
        </div>
      ) : null}
    </div>
  )
}
