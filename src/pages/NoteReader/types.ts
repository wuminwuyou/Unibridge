export type {
  NoteDetailContentType,
  NoteDetailPublishStatus,
  NoteDetailAuthor,
} from './shared/noteDetailCommon'
export type { NoteArticleDetailPayload } from './NoteArticleDetail/types'
export type { NoteVideoDetailPayload } from './NoteVideoDetail/types'
export type { NoteDetailPayload, NoteDetailLocationState } from './shared/noteDetailPayload'
export { isNoteArticleDetailPayload, isNoteVideoDetailPayload } from './shared/noteDetailPayload'
