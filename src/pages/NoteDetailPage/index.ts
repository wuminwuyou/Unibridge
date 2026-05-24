export { default } from './NoteDetailPage'
export { default as NoteDetailPage } from './NoteDetailPage'

export type {
  NoteDetailContentType,
  NoteDetailPublishStatus,
  NoteDetailAuthor,
} from './shared/noteDetailCommon'
export type {
  NoteDetailPayload,
  NoteDetailLocationState,
} from './shared/noteDetailPayload'
export { isNoteArticleDetailPayload, isNoteVideoDetailPayload } from './shared/noteDetailPayload'
export { saveNoteDetailPreview, loadNoteDetailPreview } from './shared/noteDetailPreviewSession'

export {
  NoteArticleDetailView,
  buildNoteArticleDetailFallback,
  buildNoteDetailFromProfileNote,
  buildNoteDetailFromPublishNote,
  resolveNoteArticleDetail,
} from './NoteArticleDetail'
export type { NoteArticleDetailPayload } from './NoteArticleDetail'

export {
  NoteVideoDetailView,
  buildNoteDetailFromPublishNoteVideo,
  buildNoteVideoDetailFallback,
  resolveNoteVideoDetail,
  formatVideoDurationLabel,
} from './NoteVideoDetail'
export type { NoteVideoDetailPayload } from './NoteVideoDetail'
