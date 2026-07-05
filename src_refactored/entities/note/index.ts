// entities/note — 公开接口

// Model
export type { NoteDetailContentType, NoteDetailPublishStatus, NoteDetailAuthor } from './model/noteDetailCommon'
export type {
  NoteArticleDetailPayload,
  NoteVideoDetailPayload,
  NoteDetailPayload,
  NoteDetailLocationState,
} from './model/noteDetailViewModel'
export { isNoteArticleDetailPayload, isNoteVideoDetailPayload } from './model/noteDetailViewModel'
export type { LearningNoteParentPayload } from './model/learningNoteParentPayload'
export type { NoteDetailLoadState, UseNoteDetailResult } from './model/useNoteDetail'
export { useNoteDetail } from './model/useNoteDetail'
export type { UseSimilarNotesResult } from './model/useSimilarNotes'
export { useSimilarNotes } from './model/useSimilarNotes'

// API
export { getNoteDetail, createNote, updateNote, NotesApiError } from './api/noteApi'

// Lib
export {
  noteDetailPublishStatusLabelMap,
  resolveNoteAuthorInitial,
  resolveNoteEditorialBannerText,
  formatNoteDetailTime,
} from './lib/noteDetailFormatUtils'
export { formatVideoDurationLabel } from './lib/videoDetailFormatUtils'
export { mapParentNoteToRowItem, mapNoteDetailPublishStatus, mapNoteDetailToPayload } from './lib/mapNoteDetailToPayload'

// UI — 纯展示组件
export { NoteAuthorCard } from './ui/NoteAuthorCard'
export type { NoteAuthorCardProps } from './ui/NoteAuthorCard'
export { NotePublishStatusBadge } from './ui/NotePublishStatusBadge'
export { NoteTagList } from './ui/NoteTagList'
export { NoteSummaryBox } from './ui/NoteSummaryBox'
export { NoteMetaRow } from './ui/NoteMetaRow'
export { ParentNoteEntry } from './ui/ParentNoteEntry'
export { RowNoteCard, GridNoteCard } from './ui/NoteCard'
export type { RowNoteCardItem, GridNoteCardNote } from './ui/NoteCard'
