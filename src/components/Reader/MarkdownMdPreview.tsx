import { MdPreview } from 'md-editor-rt'
import 'md-editor-rt/lib/preview.css'
import { useDocumentTheme } from '../OnlineEditor/shared/hooks/useDocumentTheme'
import { createMarkdownHeadingId } from './markdownReaderCore'
import {
  MARKDOWN_PROSE_CLASSES,
  MARKDOWN_READER_SHELL_CLASSES,
} from './markdownContentShell'
import './mdEditorSiteTheme.css'
import './MarkdownMdPreviewReader.css'

// 01）Markdown 预览 Props（MarkdownMdPreviewProps）
export interface MarkdownMdPreviewProps {
  editorId: string
  markdown: string
  className?: string
}

// 02）Markdown 预览正文（MarkdownMdPreview）
/**
 * 函数名：MarkdownMdPreview
 * 功能：仅渲染 MdPreview 正文，目录由页面侧栏单独挂载。
 * 输入：
 * - editorId：与 MdCatalog 一致的 id
 * - markdown：Markdown 原文
 * 输出：
 * - 返回值：React 节点
 */
export function MarkdownMdPreview({ editorId, markdown, className }: MarkdownMdPreviewProps) {
  const theme = useDocumentTheme()
  const trimmed = markdown.trim()

  if (!trimmed) {
    return <p className="reader-empty">暂无 Markdown 内容</p>
  }

  return (
    <div className={`markdown-md-reader ${MARKDOWN_READER_SHELL_CLASSES} ${className ?? ''}`.trim()}>
      <div className={MARKDOWN_PROSE_CLASSES}>
        <MdPreview
          id={editorId}
          modelValue={trimmed}
          theme={theme}
          language="zh-CN"
          previewTheme="default"
          codeTheme={theme === 'dark' ? 'atom' : 'github'}
          mdHeadingId={createMarkdownHeadingId}
          className="markdown-md-preview"
        />
      </div>
    </div>
  )
}
