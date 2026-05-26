// 01）解析管理员顺位文案（resolveEntityAdminOrderLabel）
/**
 * 函数名：resolveEntityAdminOrderLabel
 * 功能：将绑定顺位数字映射为中文角色说明。
 * 输入：
 * - order：1 | 2 | 3
 * 输出：
 * - 返回值：主管理员 / 副管理员 / 第 3 位管理员
 * - 副作用：无
 */
export function resolveEntityAdminOrderLabel(order: number): string {
  if (order === 1) {
    return '主管理员（第 1 位）'
  }

  if (order === 2) {
    return '副管理员（第 2 位）'
  }

  if (order === 3) {
    return '第 3 位管理员'
  }

  return `第 ${order} 位管理员`
}

// 02）格式化 QR 倒计时（formatEntityTotpQrCountdown）
/**
 * 函数名：formatEntityTotpQrCountdown
 * 功能：将剩余秒数格式化为 mm:ss 供 UI 展示。
 * 输入：
 * - remainingSec：剩余秒数
 * 输出：
 * - 返回值：如 "04:59"
 * - 副作用：无
 */
export function formatEntityTotpQrCountdown(remainingSec: number): string {
  const safeSec = Math.max(0, Math.floor(remainingSec))
  const minutes = Math.floor(safeSec / 60)
  const seconds = safeSec % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
