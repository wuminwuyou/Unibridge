// 01）目录滚动偏移 Hook（useCatalogScrollOffset）
import { useEffect, useState } from 'react'
import { getCatalogScrollOffsetPx } from '@entities/editor/lib/markdownCatalogScroll'

// 02）订阅 html.navbar-hidden 并返回目录偏移（useCatalogScrollOffset）
/**
 * 函数名：useCatalogScrollOffset
 * 功能：随 TopNavbar 显隐同步目录跳转/高亮所需的顶部偏移量。
 * 实现方法：
 * - 读取 --sticky-aside-top（隐藏导航栏时不含 navbar 高度）
 * - MutationObserver 监听 html class；scroll/resize 时刷新
 * 输入：无
 * 输出：
 * - 返回值：当前偏移像素
 * - 副作用：注册 DOM/窗口监听
 */
export function useCatalogScrollOffset(): number {
  const [offsetTop, setOffsetTop] = useState(() => getCatalogScrollOffsetPx())

  useEffect(() => {
    const updateOffset = () => {
      setOffsetTop(getCatalogScrollOffsetPx())
    }

    updateOffset()

    const observer = new MutationObserver(updateOffset)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    window.addEventListener('scroll', updateOffset, { passive: true })
    window.addEventListener('resize', updateOffset)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateOffset)
      window.removeEventListener('resize', updateOffset)
    }
  }, [])

  return offsetTop
}
