// 01）从本地视频文件读取时长（readVideoDurationFromFile）
/**
 * 函数名：readVideoDurationFromFile
 * 功能：在浏览器端解析本地视频文件时长（秒），供笔记视频上传使用。
 * 实现方法：
 * - 创建临时 object URL 并加载 metadata
 * - 读取 duration 后释放 URL
 * 输入：
 * - file：用户选择的视频 File
 * 输出：
 * - 返回值：时长（秒，整数）；无法解析时为 0
 * - 副作用：创建并释放 Object URL
 */
export function readVideoDurationFromFile(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const objectUrl = URL.createObjectURL(file)

    const finalize = (duration: number): void => {
      URL.revokeObjectURL(objectUrl)
      resolve(duration)
    }

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : 0
      finalize(Math.max(0, duration))
    }

    video.onerror = () => {
      finalize(0)
    }

    video.src = objectUrl
  })
}
