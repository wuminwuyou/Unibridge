import { MdCatalog } from 'md-editor-rt'
import 'md-editor-rt/lib/preview.css'
import { useDocumentTheme } from '../OnlineEditor/shared/hooks/useDocumentTheme'
import { createMarkdownHeadingId, markdownReaderScrollElement } from './markdownReaderCore'
import './mdEditorSiteTheme.css'
import './MarkdownMdPreviewReader.css'

// 01）Markdown 目录面板 Props（MarkdownMdCatalogPanelProps）
export interface MarkdownMdCatalogPanelProps {
  editorId: string
  className?: string
  title?: string
}

// 02）Markdown 目录面板（MarkdownMdCatalogPanel）
/**
 * 函数名：MarkdownMdCatalogPanel
 * 功能：渲染 h1–h3 目录（MdCatalog），需与同级 MdPreview 共用 editorId。
 * 输入：
 * - editorId：与 MdPreview 一致
 * 输出：
 * - 返回值：React 节点
 */
export function MarkdownMdCatalogPanel({
  editorId,
  className,
  title = '目录',
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
        theme={theme}
        catalogMaxDepth={3}
        mdHeadingId={createMarkdownHeadingId}
        className="markdown-md-catalog-panel__widget"
      />
    </nav>
  )
}
