// 01）解析 CSS 长度值为 px（parseCssLengthPx）
/**
 * 函数名：parseCssLengthPx
 * 功能：将 CSS 长度字符串（px/rem/calc 等）换算为像素值。
 * 实现方法：
 * - px 直接解析
 * - 其它单位写入临时元素 height，读取 offsetHeight
 * 输入：
 * - value：CSS 长度字符串
 * - context：用于挂载探测元素的容器，默认 documentElement
 * 输出：
 * - 返回值：像素数；无法解析时 null
 * - 副作用：短暂插入/移除 DOM 探测节点
 */
export function parseCssLengthPx(value: string, context: Element = document.documentElement): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.endsWith('px')) {
    const parsed = Number.parseFloat(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }

  const probe = document.createElement('div')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  probe.style.height = trimmed
  context.appendChild(probe)
  const px = probe.offsetHeight
  context.removeChild(probe)
  return px > 0 ? px : null
}
