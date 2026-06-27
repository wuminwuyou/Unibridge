// 01）格式化视频时长（formatVideoDurationLabel）
/**
 * 函数名：formatVideoDurationLabel
 * 功能：将秒数格式化为 mm:ss 或 hh:mm:ss 展示文案。
 * 输入：
 * - seconds：视频时长（秒）
 * 输出：
 * - 返回值：时长标签
 */
export function formatVideoDurationLabel(seconds: number): string {
  if (seconds <= 0) {
    return '00:00'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const pad = (value: number): string => String(value).padStart(2, '0')

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
  }

  return `${pad(minutes)}:${pad(secs)}`
}
