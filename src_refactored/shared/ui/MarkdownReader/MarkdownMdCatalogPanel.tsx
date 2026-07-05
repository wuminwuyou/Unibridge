// 01）Markdown 目录面板（MarkdownMdCatalogPanel）
import { MdCatalog } from 'md-editor-rt'
import 'md-editor-rt/lib/preview.css'
import { useDocumentTheme } from '@shared/hooks/useDocumentTheme'
import { createMarkdownHeadingId, markdownReaderScrollElement } from '@entities/editor/lib/markdownReaderCore'
import './mdEditorSiteTheme.css'
import './MarkdownMdPreviewReader.css'

// 02）Markdown 目录面板 Props（MarkdownMdCatalogPanelProps）
export interface MarkdownMdCatalogPanelProps {
  editorId: string
  className?: string
  title?: string
  /** 点击目录跳转时的滚动偏移（px），排除顶部导航栏 */
  scrollElementOffsetTop?: number
  /** 高亮激活校准量：标题距滚动容器顶部 ≤ 该值时高亮为当前项（默认 20） */
  offsetTop?: number
}

// 03）Markdown 目录面板组件
/**
 * 函数名：MarkdownMdCatalogPanel
 * 功能：渲染 h1–h3 目录（MdCatalog），需与同级 MdPreview 共用 editorId。
 * 实现方法：
 * - 透传 scrollElementOffsetTop（点击跳转偏移）与 offsetTop（高亮校准量）
 * 输入：
 * - editorId：与 MdPreview 一致
 * - scrollElementOffsetTop：点击目录跳转偏移（默认 0）
 * - offsetTop：高亮校准量（默认 88 = 64px 导航栏 + 24px 留白）
 * 输出：
 * - 返回值：React 节点
 */
export function MarkdownMdCatalogPanel({
  editorId,
  className,
  title = '目录',
  scrollElementOffsetTop = 0,
  offsetTop = 88,
}: MarkdownMdCatalogPanelProps) {
  const theme = useDocumentTheme()

  return (
    <nav
      className={`markdown-md-catalog-panel ${className ?? ''}`.trim()}
      aria-label="文章目录"
    >
      <p className="markdown-md-catalog-panel__title">{title}</p>
      <MdCatalog
        editorId={editorId}
        scrollElement={markdownReaderScrollElement}
        scrollElementOffsetTop={scrollElementOffsetTop}
        offsetTop={offsetTop}
        theme={theme}
        catalogMaxDepth={3}
        mdHeadingId={createMarkdownHeadingId}
        className="markdown-md-catalog-panel__widget"
      />
    </nav>
  )
}
