// 01）正文渲染编辑器类型（ContentEditorType）
export type ContentEditorType = 'MARKDOWN' | 'RICHTEXT'

// 02）Markdown 内容来源（MarkdownContentSource）
export type MarkdownContentSource = 'editor' | 'upload'

// 03）Markdown 内容变更元数据（MarkdownContentChangeMeta）
export interface MarkdownContentChangeMeta { source: MarkdownContentSource; fileName?: string | null }

// 04）在线正文编辑模式（OnlineTextEditorMode）
export type OnlineTextEditorMode = 'markdown' | 'richtext'

// 05）在线编辑器保存载荷（OnlineTextEditorSavePayload）
export interface OnlineTextEditorSavePayload { content: string; editorType: ContentEditorType }
