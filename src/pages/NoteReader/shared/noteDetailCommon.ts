// 01）笔记内容类型（NoteDetailContentType）
export type NoteDetailContentType = '图文' | '视频'

// 02）笔记详情发布状态（NoteDetailPublishStatus）
export type NoteDetailPublishStatus = 'DRAFT' | 'PREVIEW' | 'PUBLISHED'

// 03）笔记作者信息（NoteDetailAuthor）
export interface NoteDetailAuthor {
  name: string
  handle: string
  avatarUrl: string | null
}
