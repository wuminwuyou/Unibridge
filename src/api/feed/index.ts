import { HttpApiError, getApi, postApi, putApi } from '../http'
import type {
  FeedEventRequest,
  FeedInteractionTargetType,
  FeedNotesQuery,
  FeedProjectsQuery,
  FeedShuffleData,
  FeedShuffleQuery,
  HomeFeedData,
  InteractionRequest,
  ViewInteractionRequest,
} from './types'
import type { NoteResourceUid } from '../resourceUid'

// 01）Feed 接口异常类型（FeedApiError）
export class FeedApiError extends HttpApiError {}

// 02）拼接 Feed 查询路径（buildFeedQueryPath）
/**
 * 函数名：buildFeedQueryPath
 * 功能：为 Feed GET 接口拼接查询参数。
 * 实现方法：
 * - 过滤 undefined 与空字符串
 * - 返回带 query 的相对路径
 * 输入：
 * - basePath：接口相对路径
 * - params：查询参数对象
 * 输出：
 * - 返回值：完整相对路径
 * - 副作用：无
 */
function buildFeedQueryPath(
  basePath: string,
  params: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `${basePath}?${query}` : basePath
}

// 03）Feed GET 请求封装（getFeedApi）
/**
 * 函数名：getFeedApi
 * 功能：通过统一 axios 拦截器发送 Feed 模块 GET 请求。
 * 实现方法：
 * - 调用 getApi 并映射 HttpApiError 为 FeedApiError
 * 输入：
 * - path：接口相对路径
 * 输出：
 * - 返回值：业务数据
 * - 副作用：发起网络请求
 */
async function getFeedApi<TData>(path: string): Promise<TData> {
  try {
    return await getApi<TData>(path)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new FeedApiError(error.code, error.message, error.config)
    }
    throw error
  }
}

// 04）Feed 写请求封装（mutateFeedApi）
async function mutateFeedApi<TPayload extends object>(
  method: 'post' | 'put',
  path: string,
  payload: TPayload,
): Promise<void> {
  try {
    if (method === 'post') {
      await postApi<TPayload, null>(path, payload)
      return
    }
    await putApi<TPayload, null>(path, payload)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new FeedApiError(error.code, error.message, error.config)
    }
    throw error
  }
}

// 05）获取首页 Feed（getHomeFeed）
/**
 * 函数名：getHomeFeed
 * 功能：调用 GET /feed/home，获取首页笔记与项目推荐列表。
 * 实现方法：
 * - 无查询参数，直接 GET
 * 输入：无
 * 输出：
 * - 返回值：HomeFeedData（notes 5 条 + projects 10 条）
 * - 副作用：发起网络请求
 */
export async function getHomeFeed(): Promise<HomeFeedData> {
  return getFeedApi<HomeFeedData>('/feed/home')
}

// 06）生成混排洗牌 seed（createShuffleSeed）
/**
 * 函数名：createShuffleSeed
 * 功能：为 Feed「换一换」机制 B 生成一次性随机 seed，确保每次点击得到不同排序。
 * 实现方法：
 * - 优先使用 crypto.getRandomValues 生成 32 位整数
 * - 不可用时回退 Date.now()
 * 输入：无
 * 输出：
 * - 返回值：number 类型的 seed
 * - 副作用：无
 */
export function createShuffleSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1)
    crypto.getRandomValues(buffer)
    return buffer[0]
  }

  return Date.now()
}

// 07）首页 Feed 换一换（shuffleHomeFeed）
/**
 * 函数名：shuffleHomeFeed
 * 功能：调用 GET /feed/home/shuffle 获取混排换一换结果。
 * 输入：
 * - query：page / size / seed
 * 输出：
 * - 返回值：FeedShuffleData
 * - 副作用：发起网络请求
 */
export async function shuffleHomeFeed(query: FeedShuffleQuery = {}): Promise<FeedShuffleData> {
  const path = buildFeedQueryPath('/feed/home/shuffle', {
    page: query.page,
    size: query.size,
    seed: query.seed,
  })
  return getFeedApi<FeedShuffleData>(path)
}

// 07）获取项目专区 Feed（getProjectFeed）
/**
 * 函数名：getProjectFeed
 * 功能：调用 GET /feed/projects，按 category 分栏获取项目列表。
 * 输入：
 * - query：category（必填）、limit（可选）
 * 输出：
 * - 返回值：FeedContentVo[]
 * - 副作用：发起网络请求
 */
export async function getProjectFeed(query: FeedProjectsQuery) {
  const path = buildFeedQueryPath('/feed/projects', {
    category: query.category,
    limit: query.limit,
  })
  return getFeedApi<import('./types').FeedContentVo[]>(path)
}

// 08）项目专区换一换（shuffleProjectFeed）
export async function shuffleProjectFeed(query: FeedShuffleQuery & { category: FeedProjectsQuery['category'] }) {
  const path = buildFeedQueryPath('/feed/projects/shuffle', {
    category: query.category,
    page: query.page,
    size: query.size,
    seed: query.seed,
  })
  return getFeedApi<FeedShuffleData>(path)
}

// 09）获取笔记专区 Feed（getNoteFeed）
/**
 * 函数名：getNoteFeed
 * 功能：调用 GET /feed/notes，按 noteType 分栏获取笔记列表。
 * 输入：
 * - query：noteType（必填）、limit（可选）
 * 输出：
 * - 返回值：FeedContentVo[]
 * - 副作用：发起网络请求
 */
export async function getNoteFeed(query: FeedNotesQuery) {
  const path = buildFeedQueryPath('/feed/notes', {
    noteType: query.noteType,
    limit: query.limit,
  })
  return getFeedApi<import('./types').FeedContentVo[]>(path)
}

// 10）笔记专区换一换（shuffleNoteFeed）
export async function shuffleNoteFeed(query: FeedShuffleQuery & { noteType: FeedNotesQuery['noteType'] }) {
  const path = buildFeedQueryPath('/feed/notes/shuffle', {
    noteType: query.noteType,
    page: query.page,
    size: query.size,
    seed: query.seed,
  })
  return getFeedApi<FeedShuffleData>(path)
}

// 11）相似笔记推荐（getSimilarNotes）
/**
 * 函数名：getSimilarNotes
 * 功能：调用 GET /feed/notes/{uid}/similar 获取相似笔记列表。
 * 输入：
 * - noteUid：源笔记 uid
 * - limit：返回条数，默认 10
 * 输出：
 * - 返回值：FeedContentVo[]
 * - 副作用：发起网络请求
 */
export async function getSimilarNotes(noteUid: NoteResourceUid, limit = 10) {
  const path = buildFeedQueryPath(`/feed/notes/${encodeURIComponent(noteUid)}/similar`, { limit })
  return getFeedApi<import('./types').FeedContentVo[]>(path)
}

// 12）上报 Feed 行为事件（postFeedEvent）
/**
 * 函数名：postFeedEvent
 * 功能：调用 POST /feed/events 上报用户行为（使用 targetUid）。
 */
export async function postFeedEvent(payload: FeedEventRequest): Promise<void> {
  await mutateFeedApi('post', '/feed/events', payload)
}

// 13）点赞互动（putInteractionLike）
/**
 * 函数名：putInteractionLike
 * 功能：调用 PUT /interactions/like，目标使用 targetUid。
 */
export async function putInteractionLike(payload: InteractionRequest): Promise<void> {
  await mutateFeedApi('put', '/interactions/like', payload)
}

// 14）收藏互动（putInteractionCollect）
/**
 * 函数名：putInteractionCollect
 * 功能：调用 PUT /interactions/collect，目标使用 targetUid。
 */
export async function putInteractionCollect(payload: InteractionRequest): Promise<void> {
  await mutateFeedApi('put', '/interactions/collect', payload)
}

// 15）浏览计次（postInteractionView）
/**
 * 函数名：postInteractionView
 * 功能：调用 POST /interactions/view 上报浏览计次（如视频播放）。
 */
export async function postInteractionView(payload: ViewInteractionRequest): Promise<void> {
  await mutateFeedApi('post', '/interactions/view', payload)
}

export type {
  FeedContentVo,
  FeedEventRequest,
  FeedInteractionTargetType,
  FeedLoadState,
  FeedNoteType,
  FeedProjectCategory,
  FeedShuffleData,
  FeedShuffleMode,
  HomeFeedData,
  InteractionRequest,
  ViewInteractionRequest,
} from './types'

export {
  extractFeedTagLabels,
  mapFeedNoteToProfileNoteItem,
  mapFeedNotes,
  mapFeedProjectToProjectItem,
  mapFeedProjects,
  normalizeFeedTags,
} from './mappers'
