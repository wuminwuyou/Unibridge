import { useCallback, useEffect, useRef, useState } from 'react'

// 01）操作冷却 Hook 参数（UseActionCooldownOptions）
export interface UseActionCooldownOptions {
  /** 冷却时长（毫秒），默认 1000 */
  cooldownMs?: number
}

// 02）操作冷却 Hook 返回值（UseActionCooldownResult）
export interface UseActionCooldownResult {
  isOnCooldown: boolean
  remainingSeconds: number
  startCooldown: () => void
  resetCooldown: () => void
}

// 03）操作冷却 Hook（useActionCooldown）
/**
 * 函数名：useActionCooldown
 * 功能：为按钮等高频交互提供操作后时间冷却，防止连点与误触。
 * 实现方法：
 * - startCooldown 启动倒计时并在 interval 中递减 remainingMs
 * - remainingSeconds 向上取整供 UI 展示
 * - 组件卸载时清理定时器
 * 输入：
 * - options.cooldownMs：冷却时长，默认 1000ms
 * 输出：
 * - 返回值：冷却状态、剩余秒数与 start/reset 方法
 * - 副作用：组件内定时器
 */
export function useActionCooldown(options: UseActionCooldownOptions = {}): UseActionCooldownResult {
  const cooldownMs = options.cooldownMs ?? 1000
  const [remainingMs, setRemainingMs] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearCooldownTimer = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resetCooldown = useCallback((): void => {
    clearCooldownTimer()
    setRemainingMs(0)
  }, [clearCooldownTimer])

  const startCooldown = useCallback((): void => {
    clearCooldownTimer()
    setRemainingMs(cooldownMs)

    intervalRef.current = setInterval(() => {
      setRemainingMs((previousRemainingMs) => {
        const nextRemainingMs = previousRemainingMs - 250
        if (nextRemainingMs <= 0) {
          clearCooldownTimer()
          return 0
        }
        return nextRemainingMs
      })
    }, 250)
  }, [clearCooldownTimer, cooldownMs])

  useEffect(() => {
    return () => {
      clearCooldownTimer()
    }
  }, [clearCooldownTimer])

  return {
    isOnCooldown: remainingMs > 0,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    startCooldown,
    resetCooldown,
  }
}
