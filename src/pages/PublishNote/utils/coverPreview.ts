// 01）根据摘要生成封面图 Data URL（generateSummaryCoverDataUrl）
/**
 * 函数名：generateSummaryCoverDataUrl
 * 功能：基于一句话摘要生成图文笔记封面预览图（Canvas 原型）。
 * 实现方法：
 * - 绘制渐变背景与摘要截断文本
 * 输入：
 * - summary：一句话摘要
 * - title：可选标题，用于辅助展示
 * 输出：
 * - 返回值：base64 图片 Data URL
 * - 副作用：无
 */
export function generateSummaryCoverDataUrl(summary: string, title?: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const context = canvas.getContext('2d')

  if (!context) {
    return ''
  }

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#1e3a8a')
  gradient.addColorStop(1, '#3b82f6')
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = 'rgba(255,255,255,0.12)'
  context.fillRect(24, 24, canvas.width - 48, canvas.height - 48)

  context.fillStyle = '#ffffff'
  context.font = 'bold 28px "Segoe UI", "PingFang SC", sans-serif'
  const displayTitle = (title?.trim() || '笔记封面').slice(0, 18)
  context.fillText(displayTitle, 40, 72)

  context.font = '22px "Segoe UI", "PingFang SC", sans-serif'
  context.fillStyle = 'rgba(255,255,255,0.92)'

  const displaySummary = summary.trim() || '填写摘要后将自动生成封面预览'
  wrapCanvasText(context, displaySummary, 40, 120, canvas.width - 80, 32, 4)

  context.font = '14px "Segoe UI", sans-serif'
  context.fillStyle = 'rgba(255,255,255,0.65)'
  context.fillText('系统自动生成 · 原型', 40, canvas.height - 36)

  return canvas.toDataURL('image/jpeg', 0.88)
}

// 02）Canvas 多行文本换行（wrapCanvasText）
function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): void {
  const chars = Array.from(text)
  let line = ''
  let lineIndex = 0
  let cursorY = y

  for (let index = 0; index < chars.length; index += 1) {
    const testLine = line + chars[index]
    if (context.measureText(testLine).width > maxWidth && line.length > 0) {
      context.fillText(line, x, cursorY)
      line = chars[index]
      lineIndex += 1
      cursorY += lineHeight
      if (lineIndex >= maxLines) {
        return
      }
      continue
    }
    line = testLine
  }

  if (lineIndex < maxLines) {
    context.fillText(line, x, cursorY)
  }
}

// 03）截取视频首帧为封面（captureVideoFirstFrameDataUrl）
/**
 * 函数名：captureVideoFirstFrameDataUrl
 * 功能：从本地视频预览 URL 截取第一帧作为封面图。
 * 实现方法：
 * - 创建 video 元素加载 src
 * - seek 到 0.1s 后绘制到 canvas
 * 输入：
 * - videoSrc：Object URL 或远程地址
 * 输出：
 * - 返回值：Promise<string> Data URL
 * - 副作用：创建临时 video 元素
 */
export function captureVideoFirstFrameDataUrl(videoSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.src = videoSrc
    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    const cleanup = (): void => {
      video.removeAttribute('src')
      video.load()
    }

    video.addEventListener('error', () => {
      cleanup()
      reject(new Error('视频加载失败，无法截取首帧'))
    })

    video.addEventListener('loadeddata', () => {
      const seekAndCapture = (): void => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360
        const context = canvas.getContext('2d')
        if (!context) {
          cleanup()
          reject(new Error('Canvas 不可用'))
          return
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        cleanup()
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      }

      video.currentTime = Math.min(0.1, video.duration || 0.1)
      video.addEventListener('seeked', seekAndCapture, { once: true })
    })

    video.load()
  })
}
