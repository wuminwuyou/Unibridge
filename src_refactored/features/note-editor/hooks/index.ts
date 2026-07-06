// features/note-editor/hooks — 公开接口
export { useNoteCoverUpload, isRemoteAssetUrl, resolvePreviewUrlBlob } from './useNoteCoverUpload'
export type {
  UseNoteCoverUploadOptions,
  UseNoteCoverUploadResult,
  NoteCoverUploadSource,
  UploadCoverBeforeSubmitInput,
} from './useNoteCoverUpload'

export { useNoteEditorSubmit } from './useNoteEditorSubmit'
export type {
  NoteEditorSubmitContext,
  NoteEditorSubmitResultCallback,
  UseNoteEditorSubmitOptions,
  UseNoteEditorSubmitResult,
} from './useNoteEditorSubmit'

export { useNoteVideoUpload } from './useNoteVideoUpload'
export type {
  UseNoteVideoUploadOptions,
  UseNoteVideoUploadResult,
  NoteVideoSourceMode,
  UploadVideoBeforeSubmitInput,
  UploadVideoBeforeSubmitResult,
} from './useNoteVideoUpload'
