import type { NoteResourceUid } from '../../../shared/api/resourceUid'
import type { NoteDetailAuthor, NoteDetailPublishStatus } from './noteDetailCommon'
import type { ProfileNoteItem } from './profileNoteItem'

// 01）图文笔记详情载荷（NoteArticleDetailPayload）
export interface NoteArticleDetailPayload {
  uid?: NoteResourceUid
  contentType: '图文'
  title: string
  summary: string
  body: string
  tags: string[]
  coverUrl: string | null
  author: NoteDetailAuthor
  publishTime: string
  updateTime: string
  views: number
  comments: number
  favorites: number
  publishStatus: NoteDetailPublishStatus
  parentNote?: ProfileNoteItem | null
}

// 02）视频笔记详情载荷（NoteVideoDetailPayload）
export interface NoteVideoDetailPayload {
  uid?: NoteResourceUid
  contentType: '视频'
  title: string
  /** 学习笔记 Markdown 正文（对应 API body / content） */
  body: string
  summary: string
  tags: string[]
  coverUrl: string | null
  videoUrl: string
  videoDuration: number
  author: NoteDetailAuthor
  publishTime: string
  updateTime: string
  views: number
  comments: number
  favorites: number
  publishStatus: NoteDetailPublishStatus
}

// 03）笔记详情联合载荷（NoteDetailPayload）
export type NoteDetailPayload = NoteArticleDetailPayload | NoteVideoDetailPayload

// 04）笔记详情路由状态（NoteDetailLocationState）
export interface NoteDetailLocationState {
  payload?: NoteDetailPayload
  /** 从发布页预览/保存后跳转，展示「返回编辑」横幅 */
  fromPublishEditor?: boolean
}

// 05）类型守卫：图文笔记（isNoteArticleDetailPayload）
export function isNoteArticleDetailPayload(payload: NoteDetailPayload): payload is NoteArticleDetailPayload {
  return payload.contentType === '图文'
}

// 06）类型守卫：视频笔记（isNoteVideoDetailPayload）
export function isNoteVideoDetailPayload(payload: NoteDetailPayload): payload is NoteVideoDetailPayload {
  return payload.contentType === '视频'
}
