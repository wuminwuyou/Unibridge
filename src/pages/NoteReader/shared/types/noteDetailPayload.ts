import type { NoteArticleDetailPayload } from '../../ArticleNote/types'
import type { NoteVideoDetailPayload } from '../../VideoNote/types'

// 01）笔记详情联合载荷（NoteDetailPayload）
export type NoteDetailPayload = NoteArticleDetailPayload | NoteVideoDetailPayload

// 02）笔记详情路由状态（NoteDetailLocationState）
export interface NoteDetailLocationState {
  payload?: NoteDetailPayload
  /** 从发布页预览/保存后跳转，展示「返回编辑」横幅 */
  fromPublishEditor?: boolean
}

// 03）类型守卫：图文笔记（isNoteArticleDetailPayload）
export function isNoteArticleDetailPayload(payload: NoteDetailPayload): payload is NoteArticleDetailPayload {
  return payload.contentType === '图文'
}

// 04）类型守卫：视频笔记（isNoteVideoDetailPayload）
export function isNoteVideoDetailPayload(payload: NoteDetailPayload): payload is NoteVideoDetailPayload {
  return payload.contentType === '视频'
}
