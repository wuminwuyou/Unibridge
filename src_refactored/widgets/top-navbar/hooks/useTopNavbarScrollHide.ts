// 01）TopNavbar 滚动隐藏 Hook（useTopNavbarScrollHide）
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  isTopNavbarScrollHideEnabled,
  SCROLL_HIDE_ACTIVATE_OFFSET,
  SCROLL_HIDE_MIN_DELTA,
} from '../lib/topNavbarScrollHide'

// 02）Hook 返回值（UseTopNavbarScrollHideResult）
export interface UseTopNavbarScrollHideResult {
  headerClassName: string
  isScrollHideEnabled: boolean
  isNavbarVisible: boolean
}

/**
 * 函数名：useTopNavbarScrollHide
 * 功能：在笔记编辑/阅读页根据滚动方向隐藏或显示 TopNavbar。
 * 实现方法：
 * - 白名单路径命中时才绑定 scroll 监听
 * - requestAnimationFrame 节流；scrollY=0 强制显示
 * 输入：无
 * 输出：
 * - 返回值：header className 与可见性状态
 * - 副作用：window scroll 监听；同步 html.navbar-hidden 类
 */
export function useTopNavbarScrollHide(): UseTopNavbarScrollHideResult {
  const { pathname } = useLocation()
  const isScrollHideEnabled = useMemo(
    () => isTopNavbarScrollHideEnabled(pathname),
    [pathname],
  )
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const scrollRafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isScrollHideEnabled) {
      setIsNavbarVisible(true)
      return undefined
    }

    lastScrollYRef.current = window.scrollY

    const handleScroll = (): void => {
      if (scrollRafRef.current !== null) {
        return
      }

      scrollRafRef.current = window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const previousScrollY = lastScrollYRef.current
        const scrollDelta = currentScrollY - previousScrollY

        if (currentScrollY <= 0) {
          setIsNavbarVisible(true)
        } else if (
          scrollDelta > SCROLL_HIDE_MIN_DELTA
          && currentScrollY > SCROLL_HIDE_ACTIVATE_OFFSET
        ) {
          setIsNavbarVisible(false)
        } else if (scrollDelta < -SCROLL_HIDE_MIN_DELTA) {
          setIsNavbarVisible(true)
        }

        lastScrollYRef.current = currentScrollY
        scrollRafRef.current = null
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = null
      }
    }
  }, [isScrollHideEnabled, pathname])

  // 同步导航栏显隐到全局，供 sticky 侧栏动态 top 使用
  useEffect(() => {
    const root = document.documentElement

    if (!isScrollHideEnabled) {
      root.classList.remove('navbar-hidden')
      return undefined
    }

    root.classList.toggle('navbar-hidden', !isNavbarVisible)

    return () => {
      root.classList.remove('navbar-hidden')
    }
  }, [isScrollHideEnabled, isNavbarVisible])

  const headerClassName = [
    'top-header',
    isScrollHideEnabled && !isNavbarVisible ? 'top-header--scroll-hidden' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    headerClassName,
    isScrollHideEnabled,
    isNavbarVisible,
  }
}
