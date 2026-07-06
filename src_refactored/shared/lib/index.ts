// shared/lib — 公开接口
export { formatMetricCount } from './formatMetricCount'
export {
  NOTE_ARTICLE_EMPTY_COVER_URL,
  hasNoteEditorCoverInput,
  isNoteCoverDisplayable,
  isNoteCoverEmptySentinel,
  normalizeNoteEditorCoverUrl,
} from './noteCoverSentinel'
export type { NoteEditorCoverInputState } from './noteCoverSentinel'
export {
  registerUserInputSanitizer,
  resetUserInputSanitizer,
  sanitizePlainTextInput,
  sanitizeUserInput,
  type UserInputSanitizer,
  type UserInputSanitizeContext,
} from './sanitizeUserInput'
