import type { NoteDetailAuthor, NoteDetailPublishStatus } from '../shared/noteDetailCommon'

// 01）图文笔记详情载荷（NoteArticleDetailPayload）
export interface NoteArticleDetailPayload {
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
}
