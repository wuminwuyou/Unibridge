import { MarkdownMdPreview } from './MarkdownMdPreview'

// 01）目录布局（MarkdownCatalogPlacement，保留类型兼容）
export type MarkdownCatalogPlacement = 'none' | 'below' | 'left'

// 02）Markdown 阅读器 Props（MarkdownMdPreviewReaderProps）
export interface MarkdownMdPreviewReaderProps {
  markdown: string
  className?: string
  /** 目录改由页面布局挂载，此处仅保留 none */
  catalogPlacement?: MarkdownCatalogPlacement
  editorId?: string
}

// 03）Markdown 阅读器（MarkdownMdPreviewReader）
/**
 * 函数名：MarkdownMdPreviewReader
 * 功能：渲染 MdPreview 正文；目录由页面通过 MarkdownMdCatalogPanel 单独挂载。
 * 输入：
 * - markdown / editorId
 * 输出：
 * - 返回值：React 节点
 */
export function MarkdownMdPreviewReader({
  markdown,
  className,
  editorId = 'md-reader-default',
}: MarkdownMdPreviewReaderProps) {
  return <MarkdownMdPreview editorId={editorId} markdown={markdown} className={className} />
}
