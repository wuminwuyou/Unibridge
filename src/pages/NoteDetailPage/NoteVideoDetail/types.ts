import type { NoteDetailAuthor, NoteDetailPublishStatus } from '../shared/noteDetailCommon'

// 01）视频笔记详情载荷（NoteVideoDetailPayload）
export interface NoteVideoDetailPayload {
  contentType: '视频'
  title: string
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
