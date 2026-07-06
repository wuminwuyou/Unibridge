// 01）Markdown 目录滚动辅助（markdownCatalogScroll）
import { parseCssLengthPx } from '@shared/lib/parseCssLength'
import { createMarkdownHeadingId, markdownReaderScrollElement } from './markdownReaderCore'

// 02）目录跳转目标项（MarkdownCatalogTocItem）
export interface MarkdownCatalogTocItem {
  text: string
  level: number
  index: number
}

// 03）读取目录滚动/高亮偏移（getCatalogScrollOffsetPx）
/**
 * 函数名：getCatalogScrollOffsetPx
 * 功能：读取当前页面 sticky 侧栏 top 对应的像素偏移，供目录跳转与高亮校准。
 * 实现方法：
 * - 解析 html 上 --sticky-aside-top（导航栏隐藏时不含 navbar 高度）
 * 输入：无
 * 输出：
 * - 返回值：偏移像素；解析失败时 0
 * - 副作用：无
 */
export function getCatalogScrollOffsetPx(): number {
  if (typeof document === 'undefined') {
    return 0
  }

  const asideTop = getComputedStyle(document.documentElement).getPropertyValue('--sticky-aside-top')
  return parseCssLengthPx(asideTop) ?? 0
}

// 04）读取 sticky 侧栏 top（getStickyAsideTopPx）
/**
 * 函数名：getStickyAsideTopPx
 * 功能：与 getCatalogScrollOffsetPx 相同，供 TOC sticky 判定复用。
 * 输入：无
 * 输出：
 * - 返回值：像素偏移
 * - 副作用：无
 */
export function getStickyAsideTopPx(): number {
  return getCatalogScrollOffsetPx()
}

// 05）滚动至目录对应标题（scrollToMarkdownCatalogTarget）
/**
 * 函数名：scrollToMarkdownCatalogTarget
 * 功能：将页面滚动到 Markdown 目录项对应的标题位置。
 * 实现方法：
 * - 与 md-editor-rt MdCatalog 默认逻辑一致，累加 offsetParent 链
 * - 首个标题扣除 margin-block-start
 * 输入：
 * - tocItem：目录项（text/level/index）
 * - scrollElementOffsetTop：顶部固定区域高度（px）
 * - scrollElement：滚动容器，默认 documentElement
 * 输出：
 * - 返回值：void
 * - 副作用：触发 scrollTo smooth 滚动
 */
export function scrollToMarkdownCatalogTarget(
  tocItem: MarkdownCatalogTocItem,
  scrollElementOffsetTop: number,
  scrollElement: HTMLElement | string = markdownReaderScrollElement,
): void {
  if (typeof document === 'undefined') {
    return
  }

  const scrollContainer = resolveMarkdownScrollElement(scrollElement)
  if (!scrollContainer) {
    return
  }

  const headingId = createMarkdownHeadingId({
    text: tocItem.text,
    level: tocItem.level,
    index: tocItem.index,
  })
  const heading = document.getElementById(headingId)
  if (!heading) {
    return
  }

  let top = heading.offsetTop
  let offsetParent = heading.offsetParent as HTMLElement | null
  if (scrollContainer.contains(offsetParent)) {
    while (offsetParent && scrollContainer !== offsetParent) {
      top += offsetParent.offsetTop
      offsetParent = offsetParent.offsetParent as HTMLElement | null
    }
  }

  const previousElement = heading.previousElementSibling
  let marginAdjust = 0
  if (!previousElement) {
    const marginBlockStart = getComputedStyle(heading).marginBlockStart
    marginAdjust = Number.parseFloat(marginBlockStart) || 0
  }

  scrollContainer.scrollTo({
    top: top - scrollElementOffsetTop - marginAdjust,
    behavior: 'smooth',
  })
}

// 06）解析滚动容器（resolveMarkdownScrollElement）
function resolveMarkdownScrollElement(scrollElement: HTMLElement | string): HTMLElement | null {
  if (scrollElement instanceof HTMLElement) {
    return scrollElement
  }

  if (scrollElement === 'html') {
    return document.documentElement
  }

  return document.querySelector(scrollElement)
}
