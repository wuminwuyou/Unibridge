// 01）相对时间展示工具函数（getRelativeTimeDisplay）
/**
 * 函数名：getRelativeTimeDisplay
 * 功能：将 ISO 8601 格式时间转换为面向 UI 的自然语言相对日期展示。
 * 实现方法：
 * - 当天消息显示「HH:mm」
 * - 昨天显示「昨天」
 * - 近7天显示「x天前」
 * - 同年显示「M月d日」
 * - 非同年显示「yyyy年M月d日」
 * 输入：
 * - isoTime：ISO 8601 时间字符串
 * 输出：
 * - 返回值：string，自然语言日期展示文本
 * - 副作用：无
 */
export function getRelativeTimeDisplay(isoTime: string): string {
  const date = new Date(isoTime)
  const now = new Date()

  if (Number.isNaN(date.getTime())) return ''

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffMs = today.getTime() - targetDay.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  if (diffDays < 7) {
    if (diffDays === 1) return '昨天'
    return `${diffDays}天前`
  }

  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}
