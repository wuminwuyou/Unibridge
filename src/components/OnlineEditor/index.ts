// 01）在线编辑器模块公共导出（OnlineEditor）

/** 全屏编辑壳层（Markdown 源码 / Milkdown 所见即所得双模式） */
export { OnlineTextEditor } from './shell/OnlineTextEditor'
export type { OnlineTextEditorProps } from './shell/OnlineTextEditor'

/** 表单内：在线编辑 / 上传 Markdown 双选项 */
export { MarkdownContentModePicker } from './pickers/ContentModePicker/ContentModePicker'
export type { MarkdownContentModePickerProps } from './pickers/ContentModePicker/ContentModePicker'

/** 表单内：多行文本 + 上传 Markdown */
export { MarkdownEditorField } from './fields/MarkdownEditorField/MarkdownEditorField'
export type { MarkdownEditorFieldProps } from './fields/MarkdownEditorField/MarkdownEditorField'

/** 全屏 Markdown 源码子编辑器 */
export { MarkdownOnlineEditor } from './editors/markdown/MarkdownEditor'
export type { MarkdownOnlineEditorProps } from './editors/markdown/MarkdownEditor'

/** 共享类型 */
export type {
  MarkdownContentChangeMeta,
  MarkdownContentSource,
  OnlineTextEditorLocationState,
  OnlineTextEditorMode,
  OnlineTextEditorResultState,
  OnlineTextEditorSavePayload,
  PublishMarkdownEditorLocationState,
  PublishMarkdownEditorResultState,
} from './types'

/** 编辑模式偏好（localStorage） */
export {
  loadOnlineEditorModePreference,
  resolveOnlineEditorInitialMarkdown,
  saveOnlineEditorModePreference,
} from './shared/utils/onlineEditorModePreference'

export { useDocumentTheme } from './shared/hooks/useDocumentTheme'
export type { DocumentTheme } from './shared/hooks/useDocumentTheme'
