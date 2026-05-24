// 01）在线正文编辑模式（OnlineTextEditorMode）
export type OnlineTextEditorMode = 'markdown' | 'richtext'

// 02）跳转在线编辑器的路由状态（OnlineTextEditorLocationState）
export interface OnlineTextEditorLocationState {
  returnTo: string
  title: string
  initialValue: string
  /** 表单侧记录的正文格式，用于正确解析 initialValue */
  initialEditorType?: 'MARKDOWN' | 'RICHTEXT'
  /** 发布笔记页：跳转编辑器前携带的表单快照（路由 state，非 sessionStorage） */
  publishNoteRestore?: unknown
  /** 发布项目页：跳转编辑器前携带的表单快照 */
  publishProjectRestore?: unknown
}

// 03）在线编辑器保存载荷（OnlineTextEditorSavePayload）
export interface OnlineTextEditorSavePayload {
  content: string
  editorType: 'MARKDOWN' | 'RICHTEXT'
}

// 04）编辑完成回传状态（OnlineTextEditorResultState）
export interface OnlineTextEditorResultState {
  /** 兼容旧逻辑：Markdown 模式为 MD 原文；富文本模式为 HTML */
  markdownResult: string
  editorType: 'MARKDOWN' | 'RICHTEXT'
  content: string
  publishNoteRestore?: unknown
  publishProjectRestore?: unknown
}

// 04）兼容旧类型名（PublishMarkdownEditor*）
export type PublishMarkdownEditorLocationState = OnlineTextEditorLocationState
export type PublishMarkdownEditorResultState = OnlineTextEditorResultState
