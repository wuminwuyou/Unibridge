import type { NoteResourceUid } from '../../../shared/api/resourceUid'

// 01）笔记公共类型（ProfileNoteItem）
export interface ProfileNoteItem {
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
  authorNickname?: string
  authorOrganization?: string
  authorAvatar?: string
  videoDuration?: string
  status?: string
  visibility?: string
}
