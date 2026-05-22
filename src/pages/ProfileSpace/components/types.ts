// 01）个人空间笔记类型定义（ProfileNoteItem）
export interface ProfileNoteItem {
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
}
