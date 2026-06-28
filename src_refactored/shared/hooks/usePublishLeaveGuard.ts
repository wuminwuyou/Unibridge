import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'

// 01）发布页允许的站内跳转路径（不触发离开确认）
const PUBLISH_INTERNAL_NAVIGATION_PATHS = new Set(['/publish/markdown-editor'])

// 02）离开发布页守卫参数（UsePublishLeaveGuardOptions）
export interface UsePublishLeaveGuardOptions {
  /** 是否存在未保存到服务端的填写内容 */
  hasUnsavedChanges: boolean
  /** 确认离开时回调（如清理 session） */
  onConfirmLeave?: () => void
  message?: string
}

// 03）离开发布页守卫（usePublishLeaveGuard）
/**
 * 函数名：usePublishLeaveGuard
 * 功能：在发布页存在未保存内容时，拦截站内路由跳转与浏览器关闭/刷新。
 * 实现方法：
 * - react-router useBlocker 拦截同页应用内跳转
 * - allowNextNavigation 放行一次预期跳转（预览、在线编辑器等）
 * - 白名单路径（如在线编辑器）不触发拦截
 * - beforeunload 提示关闭标签页或刷新
 * 输入：
 * - hasUnsavedChanges：是否应拦截
 * 输出：
 * - 弹窗开关与确认/取消处理函数
 * - allowNextNavigation：调用后放行下一次站内跳转
 */
export function usePublishLeaveGuard(options: UsePublishLeaveGuardOptions) {
  const { hasUnsavedChanges, onConfirmLeave, message = '还没有保存草稿或发布内容，是否退出？' } = options
  const [leavePromptOpen, setLeavePromptOpen] = useState(false)
  const allowNextNavigationRef = useRef(false)

  const allowNextNavigation = useCallback((): void => {
    allowNextNavigationRef.current = true
  }, [])

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        if (allowNextNavigationRef.current) {
          allowNextNavigationRef.current = false
          return false
        }
        if (!hasUnsavedChanges) {
          return false
        }
        if (currentLocation.pathname === nextLocation.pathname) {
          return false
        }
        if (PUBLISH_INTERNAL_NAVIGATION_PATHS.has(nextLocation.pathname)) {
          return false
        }
        return true
      },
      [hasUnsavedChanges],
    ),
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setLeavePromptOpen(true)
    }
  }, [blocker.state])

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  const confirmLeave = useCallback((): void => {
    setLeavePromptOpen(false)
    onConfirmLeave?.()
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }, [blocker, onConfirmLeave])

  const cancelLeave = useCallback((): void => {
    setLeavePromptOpen(false)
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  return {
    leavePromptOpen,
    leavePromptMessage: message,
    confirmLeave,
    cancelLeave,
    allowNextNavigation,
  }
}
