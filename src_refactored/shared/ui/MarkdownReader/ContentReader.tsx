// 01）ContentReader — 通用正文阅读器（本期仅项目详情使用）
// 无 Project/Note 类型依赖，输入输出为 string，属 shared 层
import { MarkdownMdPreview } from './MarkdownMdPreview'
import type { ContentLongtext } from '@entities/editor/lib/contentLongtext'

// 02）正文阅读器 Props（ContentReaderProps）
export interface ContentReaderProps {
  /** 保存时的 UI 模式 + Markdown longtext（全站统一 Markdown 存储） */
  contentLongtext: ContentLongtext
  className?: string
  /** 与页面侧栏 MdCatalog 配对的 preview id */
  markdownPreviewId?: string
}

// 03）推断内容类型（inferContentEditorType）
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

// 04）正文阅读器（ContentReader）
/**
 * 函数名：ContentReader
 * 功能：统一使用 Md-Editor-RT 的 MdPreview 渲染 Markdown longtext。
 * 实现方法：
 * - 无论发布时使用源码模式还是 Milkdown 所见即所得，阅读器均走同一渲染链路
 * - editorType 仅表示编辑 UI 偏好，不影响阅读渲染
 * 输入：
 * - contentLongtext：Markdown longtext
 * 输出：
 * - 返回值：React 节点
 */
export function ContentReader({
  contentLongtext,
  className,
  markdownPreviewId,
}: ContentReaderProps) {
  return (
    <MarkdownMdPreview
      editorId={markdownPreviewId ?? 'md-reader-default'}
      markdown={contentLongtext.longtext}
      className={className}
    />
  )
}
