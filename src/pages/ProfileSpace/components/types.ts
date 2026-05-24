// 01）个人空间笔记类型定义（ProfileNoteItem）
import type { NoteResourceUid } from '../../../api/resourceUid'

export interface ProfileNoteItem {
  /** 对外 uid：`TX` / `VD` + 11 位 */
  uid?: NoteResourceUid
  title: string
  summary: string
  contentType: '图文' | '视频'
  tags: string[]
  publishTime: string
  updateTime: string
  views: number
  comments: number
  favorites: number
  cover: string
  authorName?: string
  authorOrganization?: string
  authorAvatar?: string
  videoDuration?: string
}
