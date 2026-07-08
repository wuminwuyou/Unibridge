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

export {
  LEVEL_DEFINITIONS,
  LEVEL_CODES,
  LEVEL_OPTIONS,
  DEFAULT_PROJECT_LEVEL,
  normalizeLevel,
} from './levelConstants'
export type { LevelDefinition } from './levelConstants'
