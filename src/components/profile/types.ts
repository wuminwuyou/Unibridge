// 01）个人空间笔记类型定义（ProfileNoteItem）
export interface ProfileNoteItem {
  title: string
  summary: string
  tags: string[]
  publishTime: string
  updateTime: string
  views: number
  favorites: number
  cover: string
}
