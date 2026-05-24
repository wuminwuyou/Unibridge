// 01）延迟等待（delay）
/**
 * 函数名：delay
 * 功能：返回在指定毫秒后 resolve 的 Promise，用于让出主线程或满足最短 Loading 时长。
 * 输入：
 * - ms：等待毫秒数
 * 输出：
 * - 返回值：Promise<void>
 * - 副作用：无
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
