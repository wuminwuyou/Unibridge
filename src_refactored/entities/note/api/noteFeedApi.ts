import { getApi, HttpApiError } from '../../../shared/api/http'
import type { NoteResourceUid } from '../../../shared/api/resourceUid'

// 01）Feed 笔记内容 VO（NoteFeedContentVo，仅供 noteFeedApi 内部使用）
export interface NoteFeedContentVo {
  contentType: 'NOTE'
  uid: NoteResourceUid
  noteType?: 'IMAGE_TEXT' | 'VIDEO'
  title: string
  summary?: string
  preview?: string
  tags?: Array<{ label: string }> | string[]
  authorNickname?: string
  authorNickName?: string
  authorName?: string
  authorAvatar?: string | null
  coverUrl?: string | null
  videoDuration?: string | number | null
  publishTime?: string
  updateTime?: string
  views?: number
  likes?: number
  favorites?: number
  comments?: number
  status?: string
  visibility?: string
}

// 02）Feed 接口异常类型（NoteFeedApiError）
export class NoteFeedApiError extends HttpApiError {}

// 03）拼接 Feed 查询路径（buildFeedQueryPath）
function buildFeedQueryPath(basePath: string, params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return query ? `${basePath}?${query}` : basePath
}

// 04）Feed GET 请求封装（wrapNoteFeedApi）
async function wrapNoteFeedApi<TData>(path: string): Promise<TData> {
  try { return await getApi<TData>(path) }
  catch (error) {
    if (error instanceof HttpApiError) throw new NoteFeedApiError(error.code, error.message)
    throw error
  }
}

// 05）相似笔记推荐（getSimilarNotes）
/**
 * 函数名：getSimilarNotes
 * 功能：调用 GET /feed/notes/{uid}/similar 获取相似笔记列表。
 * 实现方法：
 * - 拼接路径：/feed/notes/{noteUid}/similar?limit=n
 * - 通过 getApi 发起请求
 * 输入：
 * - noteUid：源笔记 uid
 * - limit：返回条数，默认 10
 * 输出：
 * - 返回值：Promise<NoteFeedContentVo[]>
 * - 副作用：发起 HTTP GET 请求
 */
export async function getSimilarNotes(
  noteUid: NoteResourceUid,
  limit = 10,
): Promise<NoteFeedContentVo[]> {
  const path = buildFeedQueryPath(
    `/feed/notes/${encodeURIComponent(noteUid)}/similar`,
    { limit },
  )
  return wrapNoteFeedApi<NoteFeedContentVo[]>(path)
}
