import { MarkdownMdPreview } from './MarkdownMdPreview'
import type { ContentLongtext } from './contentLongtext'

// 01）文章正文阅读器 Props（ArticleContentReaderProps）
export interface ArticleContentReaderProps {
  /** 保存时的 UI 模式 + Markdown longtext */
  contentLongtext: ContentLongtext
  className?: string
  /** 与页面侧栏 MdCatalog 配对的 preview id */
  markdownPreviewId?: string
}

// 02）推断内容类型（inferContentEditorType）
/**
 * 函数名：inferContentEditorType
 * 功能：兼容旧代码路径；全站 Markdown 存储后恒为 MARKDOWN。
 * 输入：
 * - _content：正文
 * 输出：
 * - 返回值：ContentEditorType
 */
export function inferContentEditorType(_content: string): 'MARKDOWN' {
  return 'MARKDOWN'
}

// 03）文章正文阅读器（ArticleContentReader）
/**
 * 函数名：ArticleContentReader
 * 功能：统一使用 Md-Editor-RT 的 MdPreview 渲染 Markdown longtext。
 * 实现方法：
 * - 无论发布时使用源码模式还是 Milkdown 所见即所得，阅读器均走同一渲染链路
 * - editorType 仅表示编辑 UI 偏好，不影响阅读渲染
 * 输入：
 * - contentLongtext：Markdown longtext
 * 输出：
 * - 返回值：React 节点
 */
export function ArticleContentReader({
  contentLongtext,
  className,
  markdownPreviewId,
}: ArticleContentReaderProps) {
  return (
    <MarkdownMdPreview
      editorId={markdownPreviewId ?? 'md-reader-default'}
      markdown={contentLongtext.longtext}
      className={className}
    />
  )
}
