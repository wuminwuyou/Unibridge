// 01）Markdown 内容来源（MarkdownContentSource）
export type MarkdownContentSource = 'editor' | 'upload'

// 02）Markdown 内容变更元数据（MarkdownContentChangeMeta）
export interface MarkdownContentChangeMeta {
  source: MarkdownContentSource
  fileName?: string | null
}
