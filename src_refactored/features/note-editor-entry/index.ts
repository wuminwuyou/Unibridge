// features/note-editor-entry — 笔记编辑类型入口公开接口

export type { NoteEditorRouteType, NoteEditorTypeOption } from './constants/noteEditorTypeOptions'
export { noteEditorTypeOptions } from './constants/noteEditorTypeOptions'

export { NoteEditorTypeModal } from './components/NoteEditorTypeModal'
export type { NoteEditorTypeModalProps } from './components/NoteEditorTypeModal'

export { useNoteEditorTypeModal } from './hooks/useNoteEditorTypeModal'
export type {
  UseNoteEditorTypeModalOptions,
  UseNoteEditorTypeModalResult,
} from './hooks/useNoteEditorTypeModal'
