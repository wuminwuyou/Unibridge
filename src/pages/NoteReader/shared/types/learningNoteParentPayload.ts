import type { NoteResourceUid } from '../../../../api/resourceUid'

// 01）学习笔记父级载荷（LearningNoteParentPayload）
/** NoteQuickMdEditor 可接受的父笔记最小接口，图文/视频载荷均需满足 */
export interface LearningNoteParentPayload {
  uid?: NoteResourceUid
  title: string
  body: string
  tags: string[]
}
