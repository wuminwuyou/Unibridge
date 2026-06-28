import type { FeedContentVo, FeedInteractionTargetType, HomeFeedData, NoteFeedData, ProjectFeedData } from '../model/types'
import { getApi, postApi, HttpApiError } from '../../../shared/api/http'

// 01）Feed 接口异常类型（FeedApiError）
export class FeedApiError extends HttpApiError {}

// 02）拼接 Feed 查询路径（buildFeedQueryPath）
function buildFeedQueryPath(basePath: string, params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) { if (value !== undefined && value !== '') searchParams.set(key, String(value)) }
  const query = searchParams.toString()
  return query ? `${basePath}?${query}` : basePath
}

// 03）Feed GET 请求封装
async function getFeedApi<TData>(path: string): Promise<TData> {
  try { return await getApi<TData>(path) }
  catch (error) { if (error instanceof HttpApiError) throw new FeedApiError(error.code, error.message); throw error }
}

// 04）获取首页 Feed（getHomeFeed）
export async function getHomeFeed(): Promise<HomeFeedData> {
  return getFeedApi<HomeFeedData>('/feed/home')
}

// 05）获取项目 Feed（getProjectFeed）
export async function getProjectFeed(params: { category?: string; recruitmentType?: string; page?: number; pageSize?: number }): Promise<ProjectFeedData> {
  return getFeedApi<ProjectFeedData>(buildFeedQueryPath('/feed/projects', params as Record<string, string>))
}

// 06）获取笔记 Feed（getNoteFeed）
export async function getNoteFeed(params: { contentType?: string; page?: number; pageSize?: number }): Promise<NoteFeedData> {
  return getFeedApi<NoteFeedData>(buildFeedQueryPath('/feed/notes', params as Record<string, string>))
}

// 07）Feed 换一换（shuffleFeed）
export async function shuffleFeed(params: { type: string; category?: string }): Promise<{ items: FeedContentVo[] }> {
  return getFeedApi<{ items: FeedContentVo[] }>(buildFeedQueryPath('/feed/shuffle', params as Record<string, string>))
}

// 08）互动操作（like / collect）
export async function sendInteraction(params: { targetType: FeedInteractionTargetType; targetUid: string; active: boolean; action: 'like' | 'collect' }): Promise<void> {
  try { await postApi('/feed/interaction', params) }
  catch (error) { if (error instanceof HttpApiError) throw new FeedApiError(error.code, error.message); throw error }
}

// 09）记录浏览（recordView）
export async function recordView(params: { targetType: FeedInteractionTargetType; targetUid: string }): Promise<void> {
  try { await postApi('/feed/view', params) }
  catch (error) { if (error instanceof HttpApiError) throw new FeedApiError(error.code, error.message); throw error }
}
