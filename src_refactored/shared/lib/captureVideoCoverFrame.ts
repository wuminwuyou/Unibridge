// 01）从视频源截取首帧封面（captureVideoCoverFrameFile）
import {
  NOTE_VIDEO_COVER_ASPECT,
  NOTE_VIDEO_COVER_OUTPUT_WIDTH,
  cropImageToCoverFile,
  getDefaultCoverCropTransform,
} from './cropCoverImage'

const VIDEO_COVER_SEEK_SECONDS = 0.1
const VIDEO_COVER_JPEG_QUALITY = 0.92

// 02）等待视频 seek 完成（seekVideoToTime）
/**
 * 函数名：seekVideoToTime
 * 功能：将 video 元素 seek 到指定时间点并等待 seeked。
 * 输入：
 * - video：HTMLVideoElement
 * - time：目标时间（秒）
 * 输出：
 * - 返回值：Promise<void>
 */
function seekVideoToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.001) {
      resolve()
      return
    }
    video.onseeked = () => {
      video.onseeked = null
      resolve()
    }
    video.currentTime = time
  })
}

// 03）加载视频并定位首帧（loadVideoElementAtFirstFrame）
/**
 * 函数名：loadVideoElementAtFirstFrame
 * 功能：加载视频 metadata 并 seek 至首帧附近，供 canvas 截帧。
 * 输入：
 * - videoSource：blob / data / http(s) 视频地址
 * 输出：
 * - 返回值：已就绪的 HTMLVideoElement
 */
function loadVideoElementAtFirstFrame(videoSource: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true

    if (videoSource.startsWith('http://') || videoSource.startsWith('https://')) {
      video.crossOrigin = 'anonymous'
    }

    video.onerror = () => {
      reject(new Error('无法加载视频'))
    }

    video.onloadedmetadata = () => {
      void (async () => {
        try {
          const duration = video.duration
          if (Number.isFinite(duration) && duration > VIDEO_COVER_SEEK_SECONDS) {
            await seekVideoToTime(video, VIDEO_COVER_SEEK_SECONDS)
          }
          resolve(video)
        } catch {
          reject(new Error('无法定位视频首帧'))
        }
      })()
    }

    video.src = videoSource
  })
}

// 04）Canvas 导出 JPEG File（canvasToJpegFile）
/**
 * 函数名：canvasToJpegFile
 * 功能：将 canvas 内容导出为 JPEG File。
 * 输入：
 * - canvas：已绘制视频帧的 canvas
 * 输出：
 * - 返回值：File（video-cover-raw.jpg）
 */
function canvasToJpegFile(canvas: HTMLCanvasElement): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('无法生成封面图片'))
          return
        }
        resolve(new File([blob], 'video-cover-raw.jpg', { type: 'image/jpeg' }))
      },
      'image/jpeg',
      VIDEO_COVER_JPEG_QUALITY,
    )
  })
}

// 05）视频首帧原始 File（captureVideoCoverFrameRawFile）
/**
 * 函数名：captureVideoCoverFrameRawFile
 * 功能：从视频首帧截取原始比例 JPEG File，供后续裁剪调整。
 * 输入：
 * - videoSource：blob / data / http(s) 视频地址
 * 输出：
 * - 返回值：原始帧 File
 */
export async function captureVideoCoverFrameRawFile(videoSource: string): Promise<File> {
  const trimmedSource = videoSource.trim()
  if (!trimmedSource) {
    throw new Error('缺少视频源')
  }

  const video = await loadVideoElementAtFirstFrame(trimmedSource)

  try {
    const width = video.videoWidth
    const height = video.videoHeight

    if (!width || !height) {
      throw new Error('无法读取视频画面尺寸')
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('无法创建画布')
    }

    context.drawImage(video, 0, 0, width, height)
    return canvasToJpegFile(canvas)
  } finally {
    video.removeAttribute('src')
    video.load()
  }
}

/**
 * 函数名：captureVideoCoverFrameFile
 * 功能：从视频首帧截取 16:9 居中封面图并返回 JPEG File，供笔记封面上传使用。
 * 实现方法：
 * - 加载视频 metadata 并 seek 至首帧
 * - 截取原始帧后按 16:9 居中裁剪
 * 输入：
 * - videoSource：blob / data / http(s) 视频地址
 * 输出：
 * - 返回值：封面 File
 * - 副作用：创建临时 video / canvas 元素
 */
export async function captureVideoCoverFrameFile(videoSource: string): Promise<File> {
  const rawFile = await captureVideoCoverFrameRawFile(videoSource)
  const rawUrl = URL.createObjectURL(rawFile)
  try {
    return await cropImageToCoverFile(
      rawUrl,
      NOTE_VIDEO_COVER_ASPECT,
      getDefaultCoverCropTransform(),
      NOTE_VIDEO_COVER_OUTPUT_WIDTH,
      'video-cover.jpg',
    )
  } finally {
    URL.revokeObjectURL(rawUrl)
  }
}

/**
 * 函数名：captureVideoCoverFrameWithSource
 * 功能：截取视频首帧并同时返回原始帧与 16:9 封面，供编辑器保留调整源图。
 * 输入：
 * - videoSource：视频地址
 * 输出：
 * - 返回值：{ rawFile, coverFile }
 */
export async function captureVideoCoverFrameWithSource(
  videoSource: string,
): Promise<{ rawFile: File; coverFile: File }> {
  const rawFile = await captureVideoCoverFrameRawFile(videoSource)
  const rawUrl = URL.createObjectURL(rawFile)
  try {
    const coverFile = await cropImageToCoverFile(
      rawUrl,
      NOTE_VIDEO_COVER_ASPECT,
      getDefaultCoverCropTransform(),
      NOTE_VIDEO_COVER_OUTPUT_WIDTH,
      'video-cover.jpg',
    )
    return { rawFile, coverFile }
  } finally {
    URL.revokeObjectURL(rawUrl)
  }
}
