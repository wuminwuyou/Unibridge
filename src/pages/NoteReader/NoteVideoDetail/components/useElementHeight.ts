import { useEffect, useRef, useState } from 'react'

// 01）元素高度监听 Hook（useElementHeight）
/**
 * 函数名：useElementHeight
 * 功能：返回一个 ref 与目标元素（自身或后代）的当前像素高度；目标元素尺寸/出现/消失时自动更新。
 * 实现方法：
 * - ref 绑定到外层包装元素；可选 childSelector 指定要测量的后代节点（如 ArtPlayer 渲染的 .art-video）
 * - 若指定 childSelector：使用 MutationObserver 等待后代节点出现/替换，再交给 ResizeObserver 监听
 * - 若未指定：直接观察 ref 自身
 * - 卸载或后代元素切换时断开旧的 ResizeObserver，避免内存泄漏
 * 输入：
 * - childSelector：要监听的后代节点 CSS 选择器，可选；为空则监听 ref 自身
 * 输出：
 * - 返回值：[ref, height]
 *   - ref：要挂载到外层包装 DOM 的 React ref
 *   - height：当前测量的像素高度（未测量到时为 null）
 * - 副作用：注册 / 注销 ResizeObserver、MutationObserver
 */
export function useElementHeight<T extends HTMLElement = HTMLDivElement>(
  childSelector?: string,
): [React.RefObject<T>, number | null] {
  const ref = useRef<T>(null)
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }

    let resizeObserver: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let currentTarget: HTMLElement | null = null

    const observeTarget = (el: HTMLElement) => {
      if (currentTarget === el) {
        return
      }
      resizeObserver?.disconnect()
      currentTarget = el
      setHeight(el.getBoundingClientRect().height)
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const nextHeight = entry.contentRect.height
          if (nextHeight > 0) {
            setHeight(nextHeight)
          }
        }
      })
      resizeObserver.observe(el)
    }

    const resolveTarget = (): HTMLElement | null =>
      childSelector ? node.querySelector<HTMLElement>(childSelector) : node

    const initial = resolveTarget()
    if (initial) {
      observeTarget(initial)
    }

    if (childSelector) {
      mutationObserver = new MutationObserver(() => {
        const found = resolveTarget()
        if (found && found !== currentTarget) {
          observeTarget(found)
        }
      })
      mutationObserver.observe(node, { childList: true, subtree: true })
    }

    return () => {
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [childSelector])

  return [ref, height]
}
