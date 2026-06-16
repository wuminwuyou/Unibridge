import type { MessageItem } from '../../types'

// 01）消息时间分割线 Props（MessageTimeDividerProps）
interface MessageTimeDividerProps {
  /** 当前消息 */
  current: MessageItem
  /** 前一条消息（可能为空） */
  previous?: MessageItem | null
}

// 02）消息时间分割线组件（MessageTimeDivider）
/**
 * 函数名：MessageTimeDivider
 * 功能：在两条消息时间间隔较大时插入「日期分割线」，辅助阅读时间流速。
 * 实现方法：
 * - 比较当前消息与上一条消息的 time 字段（HH:mm）
 * - 若间隔超过 30 分钟（按时间差推算），或消息方向/发送者变更，渲染时间分割线
 * - 显示「yyyy年M月d日 HH:mm」格式的完整时间
 * 输入：
 * - current：当前消息
 * - previous：上一条消息
 * 输出：
 * - 返回值：JSX.Element | null（不需要时返回 null）
 * - 副作用：无
 */
export function MessageTimeDivider({ current, previous }: MessageTimeDividerProps) {
  if (!previous) return null

  // 简易时间解析：比较 time 字段
  const currentMinutes = parseTimeToMinutes(current.time)
  const previousMinutes = parseTimeToMinutes(previous.time)

  if (currentMinutes !== null && previousMinutes !== null) {
    const diff = Math.abs(currentMinutes - previousMinutes)
    // 间隔超过 30 分钟展示分割线
    if (diff < 30) return null
  }

  return (
    <div className="msg-time-divider" role="separator" aria-label={`消息时间：${current.time}`}>
      <span className="msg-time-divider__text">{current.time}</span>
    </div>
  )
}

// 03）将 HH:mm 转换为分钟数（parseTimeToMinutes）
function parseTimeToMinutes(timeStr: string): number | null {
  const parts = timeStr.split(':')
  if (parts.length !== 2) return null
  const hours = Number.parseInt(parts[0], 10)
  const minutes = Number.parseInt(parts[1], 10)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

export default MessageTimeDivider
