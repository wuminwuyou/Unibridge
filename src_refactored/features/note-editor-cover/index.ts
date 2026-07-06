// features/note-editor-cover — 笔记封面 Feature 公开接口

export type {
  NoteCoverSource,
  SetCoverFileOptions,
  UseNoteCoverPickerOptions,
  UseNoteCoverPickerResult,
} from './hooks/useNoteCoverPicker'
export { useNoteCoverPicker } from './hooks/useNoteCoverPicker'

export { NoteCoverPicker } from './components/NoteCoverPicker'
export type { NoteCoverPickerProps } from './components/NoteCoverPicker'

export { NoteCoverAdjustModal } from './components/NoteCoverAdjustModal'
export type { NoteCoverAdjustModalProps } from './components/NoteCoverAdjustModal'
