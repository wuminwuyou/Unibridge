// features/note-editor — 笔记编辑 Feature 公开接口

// Services
export type { NoteEditorContentType, NoteEditorFormDraft } from './services/noteEditorService'
export {
  buildUpsertNoteRequest,
  submitNote,
  isNoteEditorFormEmpty,
} from './services/noteEditorService'

// Lib — 预览 Session
export {
  saveNoteDetailPreview,
  loadNoteDetailPreview,
  clearNoteDetailPreview,
} from './lib/noteDetailPreviewSession'

// Lib — 构建详情预览载荷
export { buildNoteDetailFromEditorDraft } from './lib/buildNoteDetailFromEditorDraft'

// Lib — 表单 Session
export type { NoteEditorRouteType, NoteEditorSession } from './lib/noteEditorFormSession'
export {
  createDefaultNoteEditorDraft,
  normalizeNoteEditorContentType,
  resolveNoteEditorContentType,
  loadNoteEditorFormSession,
  saveNoteEditorFormSession,
  clearNoteEditorFormSession,
} from './lib/noteEditorFormSession'

// Lib — 表单校验
export { validateNoteEditorDraft } from './lib/noteEditorValidation'

// Lib — 返回编辑路径
export { resolveNoteEditorReturnPath } from './lib/resolveNoteEditorReturnPath'

// Constants
export { suggestedNoteTags } from './constants/suggestedNoteTags'

// Hooks — 封面上传 / 提交
export {
  useNoteCoverUpload,
  useNoteEditorSubmit,
  isRemoteAssetUrl,
  resolvePreviewUrlBlob,
} from './hooks'
export type {
  UseNoteCoverUploadOptions,
  UseNoteCoverUploadResult,
  NoteCoverUploadSource,
  UploadCoverBeforeSubmitInput,
  NoteEditorSubmitContext,
  UseNoteEditorSubmitOptions,
  UseNoteEditorSubmitResult,
} from './hooks'
