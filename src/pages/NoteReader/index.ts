export { default } from './NoteReaderPage'
export { default as NoteReaderPage } from './NoteReaderPage'
export { default as NoteDetailPage } from './NoteReaderPage'

export type {
  NoteDetailContentType,
  NoteDetailPublishStatus,
  NoteDetailAuthor,
  NoteArticleDetailPayload,
  NoteVideoDetailPayload,
  NoteDetailPayload,
  NoteDetailLocationState,
} from './types'
export { isNoteArticleDetailPayload, isNoteVideoDetailPayload } from './shared/noteDetailPayload'
export { saveNoteDetailPreview, loadNoteDetailPreview } from './shared/noteDetailPreviewSession'
export { buildNoteDetailHref, parseNoteDetailUidFromQuery } from './shared/noteDetailRouting'

export {
  TextNoteReaderView,
  buildNoteArticleDetailFallback,
  buildNoteDetailFromPublishNote,
  resolveNoteArticleDetail,
} from './NoteArticleDetail'

export {
  NoteVideoDetailView,
  buildNoteDetailFromPublishNoteVideo,
  buildNoteVideoDetailFallback,
  resolveNoteVideoDetail,
  formatVideoDurationLabel,
} from './NoteVideoDetail'

export { useNoteReaderPage } from './useNoteReaderPage'
export { useNoteReaderFromApi } from './useNoteReaderFromApi'
export type { NoteReaderApiLoadState, UseNoteReaderFromApiResult } from './useNoteReaderFromApi'
