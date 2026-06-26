import type { NoteResourceUid, ProjectResourceUid } from '../resourceUid'

// 01）Feed 内容类型（FeedContentType）
export type FeedContentType = 'NOTE' | 'PROJECT'

// 02）Feed 互动目标类型（FeedInteractionTargetType）
export type FeedInteractionTargetType = 'NOTE' | 'PROJECT'

// 03）Feed 行为事件类型（FeedEventType）
export type FeedEventType = 'VIEW_DETAIL' | 'LIKE' | 'COLLECT'

// 04）Feed 卡片内容 VO（FeedContentVo）
/** 列表卡片统一使用对外 `uid`，禁止使用自增数字 id */
export interface FeedContentVo {
  contentType: FeedContentType
  uid: ProjectResourceUid | NoteResourceUid
  noteType?: 'IMAGE_TEXT' | 'VIDEO'
  projectCategory?: 'COMMERCIAL' | 'RECRUITMENT'
  recruitmentType?: string | null
  title: string
  preview?: string
  summary?: string
  tags?: Array<{ label: string }> | string[]
  ownerOrganization?: string
  logoSvgUrl?: string | null
  level?: string
  teamSize?: string | null
  duration?: string | null
  coverUrl?: string | null
  /** 作者昵称（公共区域禁止返回实名 name） */
  authorNickname?: string
  /** @deprecated 请改用 authorNickname */
  authorName?: string
  authorOrganization?: string
  authorAvatar?: string | null
  /** 视频笔记时长；推荐 `MM:SS` 字符串，或秒数 number */
  videoDuration?: string | number | null
  publishTime?: string
  views?: number
  /** 点赞数 → 网格卡片页脚 ThumbsUp */
  likes?: number
  /** 收藏数 → 网格卡片页脚 Heart */
  favorites?: number
  /** 评论数 → 行卡片元信息（可选） */
  comments?: number
  score?: number
  /** 笔记状态：DRAFT | REVIEWING | PUBLISHED | BANNED（个人空间本人视角返回） */
  status?: string
  /** 笔记可见性：PUBLIC | PRIVATE（个人空间本人视角返回） */
  visibility?: string
}

// 05）Feed 行为捕获请求（FeedEventRequest）
export interface FeedEventRequest {
  eventType: FeedEventType
  targetType: FeedInteractionTargetType
  /** 目标资源对外 uid（原 targetId） */
  targetUid: ProjectResourceUid | NoteResourceUid
  tags?: string[]
}

// 06）互动请求（InteractionRequest）
export interface InteractionRequest {
  targetType: FeedInteractionTargetType
  /** 目标资源对外 uid（原 targetId） */
  targetUid: ProjectResourceUid | NoteResourceUid
  active: boolean
}

// 07）浏览计次请求（ViewInteractionRequest）
export interface ViewInteractionRequest {
  targetType: FeedInteractionTargetType
  targetUid: ProjectResourceUid | NoteResourceUid
}

// 08）Feed 加载状态（FeedLoadState）
export type FeedLoadState = 'loading' | 'error' | 'ready'

// 09）首页 Feed 响应（HomeFeedData）
export interface HomeFeedData {
  notes: FeedContentVo[]
  projects: FeedContentVo[]
}

// 10）Feed 混排模式（FeedShuffleMode）
export type FeedShuffleMode = 'CACHE_PAGE' | 'RANDOM_SEED'

// 11）Feed 混排响应（FeedShuffleData）
export interface FeedShuffleData {
  items: FeedContentVo[]
  page: number
  size: number
  total: number
  pageWrapped: boolean
  shuffleMode: FeedShuffleMode
}

// 12）项目 Feed 分类（FeedProjectCategory）
export type FeedProjectCategory = 'COMMERCIAL' | 'RECRUITMENT'

// 13）笔记 Feed 类型（FeedNoteType）
export type FeedNoteType = 'IMAGE_TEXT' | 'VIDEO'

// 14）项目 Feed 查询参数（FeedProjectsQuery）
export interface FeedProjectsQuery {
  category: FeedProjectCategory
  limit?: number
}

// 15）笔记 Feed 查询参数（FeedNotesQuery）
export interface FeedNotesQuery {
  noteType: FeedNoteType
  limit?: number
}

// 16）Feed 混排查询参数（FeedShuffleQuery）
export interface FeedShuffleQuery {
  page?: number
  size?: number
  seed?: number
  category?: FeedProjectCategory
  noteType?: FeedNoteType
}
