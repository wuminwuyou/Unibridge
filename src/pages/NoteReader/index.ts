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
export { isNoteArticleDetailPayload, isNoteVideoDetailPayload } from './shared/types/noteDetailPayload'
export { saveNoteDetailPreview, loadNoteDetailPreview, clearNoteDetailPreview } from './shared/services/noteDetailPreviewSession'
export { buildNoteDetailHref, parseNoteDetailUidFromQuery } from './shared/services/noteDetailRouting'

export {
  ArticleNoteView,
  buildNoteArticleDetailFallback,
  buildNoteDetailFromPublishNote,
  resolveNoteArticleDetail,
} from './ArticleNote'

export {
  VideoNoteView,
  resolveNoteVideoDetail,
  formatVideoDurationLabel,
} from './VideoNote'

export { useNoteReaderPage } from './hooks/useNoteReaderPage'
export { useNoteReaderFromApi } from './hooks/useNoteReaderFromApi'
export type { NoteReaderApiLoadState, UseNoteReaderFromApiResult } from './hooks/useNoteReaderFromApi'
