// 01）Markdown 目录面板（MarkdownMdCatalogPanel）
import { useCallback, type MouseEvent as ReactMouseEvent } from 'react'
import { MdCatalog } from 'md-editor-rt'
import type { HeadList } from 'md-editor-rt'
import 'md-editor-rt/lib/preview.css'
import { useDocumentTheme } from '@shared/hooks/useDocumentTheme'
import { useCatalogScrollOffset } from '@shared/hooks/useCatalogScrollOffset'
import { requestTopNavbarHide } from '@shared/lib/topNavbarScrollControl'
import { createMarkdownHeadingId, markdownReaderScrollElement } from '@entities/editor/lib/markdownReaderCore'
import {
  getCatalogScrollOffsetPx,
  scrollToMarkdownCatalogTarget,
} from '@entities/editor/lib/markdownCatalogScroll'
import './mdEditorSiteTheme.css'
import './MarkdownMdPreviewReader.css'

// 02）Markdown 目录面板 Props（MarkdownMdCatalogPanelProps）
export interface MarkdownMdCatalogPanelProps {
  editorId: string
  className?: string
  title?: string
  /** 点击目录跳转时的滚动偏移（px）；未传时随导航栏显隐读取 --sticky-aside-top */
  scrollElementOffsetTop?: number
  /** 高亮激活校准量；未传时与 scrollElementOffsetTop 一致 */
  offsetTop?: number
  /** 点击目录时强制隐藏 TopNavbar，并以无导航栏高度的偏移量跳转 */
  hideTopNavbarOnNavigate?: boolean
}

// 03）Markdown 目录面板组件
/**
 * 函数名：MarkdownMdCatalogPanel
 * 功能：渲染 h1–h3 目录（MdCatalog），需与同级 MdPreview 共用 editorId。
 * 实现方法：
 * - 透传 scrollElementOffsetTop（点击跳转偏移）与 offsetTop（高亮校准量）
 * - hideTopNavbarOnNavigate 时拦截点击：隐藏导航栏后按 --sticky-aside-top 跳转
 * 输入：
 * - editorId：与 MdPreview 一致
 * - scrollElementOffsetTop / offsetTop：可选；缺省时随导航栏显隐动态取值
 * - hideTopNavbarOnNavigate：是否在点击时隐藏 TopNavbar
 * 输出：
 * - 返回值：React 节点
 */
export function MarkdownMdCatalogPanel({
  editorId,
  className,
  title = '目录',
  scrollElementOffsetTop,
  offsetTop,
  hideTopNavbarOnNavigate = false,
}: MarkdownMdCatalogPanelProps) {
  const theme = useDocumentTheme()
  const dynamicOffsetTop = useCatalogScrollOffset()
  const resolvedScrollOffsetTop = scrollElementOffsetTop ?? dynamicOffsetTop
  const resolvedOffsetTop = offsetTop ?? resolvedScrollOffsetTop

  const handleCatalogClick = useCallback(
    (event: ReactMouseEvent, tocItem: HeadList & { index: number }) => {
      if (!hideTopNavbarOnNavigate) {
        return
      }

      requestTopNavbarHide()
      event.preventDefault()

      const scrollOffset = getCatalogScrollOffsetPx()
      scrollToMarkdownCatalogTarget(
        {
          text: tocItem.text,
          level: tocItem.level,
          index: tocItem.index,
        },
        scrollOffset,
      )
    },
    [hideTopNavbarOnNavigate],
  )

  return (
    <nav
      className={`markdown-md-catalog-panel ${className ?? ''}`.trim()}
      aria-label="文章目录"
    >
      <p className="markdown-md-catalog-panel__title">{title}</p>
      <MdCatalog
        editorId={editorId}
        scrollElement={markdownReaderScrollElement}
        scrollElementOffsetTop={resolvedScrollOffsetTop}
        offsetTop={resolvedOffsetTop}
        theme={theme}
        catalogMaxDepth={3}
        mdHeadingId={createMarkdownHeadingId}
        className="markdown-md-catalog-panel__widget"
        onClick={hideTopNavbarOnNavigate ? handleCatalogClick : undefined}
      />
    </nav>
  )
}
