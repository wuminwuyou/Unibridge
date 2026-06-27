export type {
  NoteDetailContentType,
  NoteDetailPublishStatus,
  NoteDetailAuthor,
} from '../shared/types/noteDetailCommon'
export type { NoteArticleDetailPayload } from '../ArticleNote/types'
export type { NoteVideoDetailPayload } from '../VideoNote/types'
export type { NoteDetailPayload, NoteDetailLocationState } from '../shared/types/noteDetailPayload'
export { isNoteArticleDetailPayload, isNoteVideoDetailPayload } from '../shared/types/noteDetailPayload'
