import type { NoteResourceUid } from '../../../shared/api/resourceUid'

// 01）笔记详情作者 DTO（NoteDetailAuthorDto）
export interface NoteDetailAuthorDto {
  uid?: string; name: string; organization: string; avatarUrl: string | null
}

// 02）父笔记简要 DTO（ParentNoteDto）
export interface ParentNoteDto {
  uid: string
  title: string
  summary: string
  contentType: '图文' | '视频'
  tags: string[]
  cover: string
  views: number
  comments: number
  favorites: number
  publishTime?: string
  authorNickname?: string
  authorNickName?: string
  authorName?: string
  author?: NoteDetailAuthorDto
}

// 03）笔记详情响应 DTO（NoteDetailDto）
export interface NoteDetailDto {
  uid: NoteResourceUid; contentType: '图文' | '视频'; contentTypeCode: string
  title: string; summary: string; body: string | null; tags: string[]
  coverUrl: string; videoUrl?: string; videoDuration?: number
  author: NoteDetailAuthorDto; publishTime: string; updateTime: string
  views: number; comments: number; favorites: number
  status: 'DRAFT' | 'PUBLISHED'; visibility?: 'PUBLIC' | 'PRIVATE'
  parentNote?: ParentNoteDto | null
}

// 04）笔记发布动作（NotePublishAction）
export type NotePublishAction = 'DRAFT' | 'PUBLISH'

// 05）创建/更新笔记请求体（UpsertNoteRequest）
export interface UpsertNoteRequest {
  publishAction: NotePublishAction; title: string; summary: string
  contentType: '图文' | '视频'; content?: string | null; tags: string[]
  coverUrl: string; videoUrl?: string; videoDuration?: number
  parentContentTypeCode?: string; visibility?: 'PUBLIC' | 'PRIVATE'
}

// 06）笔记写操作响应（UpsertNoteResponse）
export interface UpsertNoteResponse {
  uid: NoteResourceUid; contentTypeCode: string; publishAction: NotePublishAction
  status: 'DRAFT' | 'PUBLISHED'; publishedAt: string | null; createdAt: string; updatedAt: string
}

// 07）秒传预检响应（UploadMd5CheckResult）
export interface UploadMd5CheckResult { exists: boolean; filePath: string | null }

// 08）封面上传响应（NoteCoverUploadResponse）
export interface NoteCoverUploadResponse { coverUrl: string }

// 09）视频上传响应（NoteVideoUploadResponse）
export interface NoteVideoUploadResponse { videoUrl: string; videoDuration: number; coverUrl?: string }
