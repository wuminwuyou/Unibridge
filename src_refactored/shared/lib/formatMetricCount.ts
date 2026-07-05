// 01）互动数字格式化（formatMetricCount）
/**
 * 函数名：formatMetricCount
 * 功能：将浏览/评论/收藏等互动数格式化为展示文案。
 * 实现方法：
 * - 低于 10000：原样展示整数
 * - 达到 10000：格式为 x.x万（去掉末尾 .0）
 * 输入：
 * - value：原始计数
 * 输出：
 * - 返回值：展示字符串
 */
export function formatMetricCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0'
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1).replace(/\.0$/, '')}万`
  }
  return String(Math.floor(value))
}
