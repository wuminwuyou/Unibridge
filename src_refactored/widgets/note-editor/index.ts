// widgets/note-editor — 笔记编辑 Widget 公开接口

export { default } from './NoteEditorWidget'
export { NoteEditorWidget } from './NoteEditorWidget'

export { useNoteEditorForm } from './hooks/useNoteEditorForm'
export type { NoteEditorSubmitPhase, UseNoteEditorFormResult } from './hooks/useNoteEditorForm'

export {
  NoteArticleEditorLayout,
  NoteArticleEditorForm,
  NoteEditorActionBar,
  NoteEditorMissingTypeFallback,
  NoteVideoEditorForm,
} from './components'

export { mapNoteDetailToEditorDraft } from './lib/mapNoteDetailToEditorDraft'
export type { NoteDetailToEditorDraftResult } from './lib/mapNoteDetailToEditorDraft'
