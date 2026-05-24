// 01）笔记详情作者 DTO（NoteDetailAuthorDto）
export interface NoteDetailAuthorDto {
  name: string
  handle: string
  avatarUrl: string | null
}

// 02）笔记详情响应 DTO（NoteDetailDto）
export interface NoteDetailDto {
  noteId: number
  contentType: '图文' | '视频'
  contentTypeCode: string
  title: string
  summary: string
  body: string | null
  editorType: 'MARKDOWN' | 'RICHTEXT'
  tags: string[]
  coverUrl: string
  videoUrl?: string
  videoDuration?: number
  author: NoteDetailAuthorDto
  publishTime: string
  updateTime: string
  views: number
  comments: number
  favorites: number
  status: 'DRAFT' | 'PUBLISHED'
}

// 03）笔记发布动作（NotePublishAction）
export type NotePublishAction = 'DRAFT' | 'PUBLISH'

// 04）创建/更新笔记请求体（UpsertNoteRequest）
export interface UpsertNoteRequest {
  publishAction: NotePublishAction
  title: string
  summary: string
  contentType: '图文' | '视频'
  content?: string | null
  tags: string[]
  coverUrl: string
  videoUrl?: string
  videoDuration?: number
}

// 05）笔记写操作响应（UpsertNoteResponse）
export interface UpsertNoteResponse {
  noteId: number
  contentTypeCode: string
  publishAction: NotePublishAction
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// 06）秒传预检响应（UploadMd5CheckResult）
export interface UploadMd5CheckResult {
  exists: boolean
  filePath: string | null
}

// 07）封面上传响应（NoteCoverUploadResponse）
export interface NoteCoverUploadResponse {
  coverUrl: string
}

// 08）视频上传响应（NoteVideoUploadResponse）
export interface NoteVideoUploadResponse {
  videoUrl: string
  videoDuration: number
  coverUrl?: string
}
