import type { NoteResourceUid, ProjectResourceUid } from '../../../shared/api/resourceUid'

// 01）Feed 内容类型
export type FeedContentType = 'NOTE' | 'PROJECT'
export type FeedInteractionTargetType = 'NOTE' | 'PROJECT'
export type FeedEventType = 'VIEW_DETAIL' | 'LIKE' | 'COLLECT'

// 02）Feed 卡片内容 VO（FeedContentVo）
export interface FeedContentVo {
  contentType: FeedContentType
  uid: ProjectResourceUid | NoteResourceUid
  noteType?: 'IMAGE_TEXT' | 'VIDEO'; projectCategory?: 'COMMERCIAL' | 'RECRUITMENT'
  recruitmentType?: string | null; title: string; preview?: string; summary?: string
  tags?: Array<{ label: string }> | string[]; ownerOrganization?: string
  publisherName?: string | null; publisherAvatar?: string | null
  amountMin?: string | null; amountMax?: string | null
  logoSvgUrl?: string | null; level?: string; duration?: string | null
  coverUrl?: string | null; authorNickname?: string; authorName?: string
  authorAvatar?: string | null
  videoDuration?: string | number | null; publishTime?: string; views?: number
  likes?: number; favorites?: number; comments?: number; score?: number
  status?: string; visibility?: string
}

// 03）Feed 行为捕获请求
export interface FeedEventRequest {
  eventType: FeedEventType; targetType: FeedInteractionTargetType
  targetUid: ProjectResourceUid | NoteResourceUid; tags?: string[]
}

// 04）首页 Feed 数据
export interface HomeFeedData { projects: FeedContentVo[]; notes: FeedContentVo[] }

// 05）项目 Feed 数据
export interface ProjectFeedData { items: FeedContentVo[]; total: number; page: number; pageSize: number }

// 06）笔记 Feed 数据
export interface NoteFeedData { items: FeedContentVo[]; total: number; page: number; pageSize: number }

// 07）Feed 加载状态
export type FeedLoadState = 'loading' | 'error' | 'ready'
