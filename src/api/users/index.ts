import { HttpApiError, getApi } from '../http'
import type { UserResourceUid } from '../resourceUid'
import type { UserPublicPreviewDto } from './types'

// 01）用户接口异常类型（UserApiError）
export class UserApiError extends HttpApiError {}

// 02）获取用户公开预览（getUserPublicPreview）
/**
 * 函数名：getUserPublicPreview
 * 功能：根据 uid 拉取用户公开预览信息，用于管理成员表单校验待添加用户。
 * 输入：
 * - uid：用户对外 uid
 * 输出：
 * - 返回值：UserPublicPreviewDto
 * - 副作用：发起网络请求
 */
export async function getUserPublicPreview(uid: UserResourceUid): Promise<UserPublicPreviewDto> {
  const encodedUid = encodeURIComponent(uid.trim())

  try {
    const data = await getApi<Record<string, unknown>>(`/users/${encodedUid}/public-preview`)
    const nickname = typeof data.nickname === 'string' ? data.nickname.trim() : ''
    const realNameRaw = data.realName ?? data.real_name
    const realName =
      typeof realNameRaw === 'string' && realNameRaw.trim().length > 0 ? realNameRaw.trim() : null

    return {
      uid: (typeof data.uid === 'string' ? data.uid : uid) as UserResourceUid,
      nickname,
      realName,
      avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : null,
    }
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new UserApiError(error.code, error.message)
    }
    throw error
  }
}

// 03）搜索用户（searchUsers）
/**
 * 函数名：searchUsers
 * 功能：按关键词搜索用户（匹配 uid / nickname / realName）。
 * 输入：
 * - keyword：搜索关键词
 * 输出：
 * - 返回值：UserPublicPreviewDto[]
 * - 副作用：发起网络请求
 */
export async function searchUsers(keyword: string): Promise<UserPublicPreviewDto[]> {
  const searchParams = new URLSearchParams()
  searchParams.set('keyword', keyword.trim())

  try {
    const data = await getApi<Record<string, unknown>>(`/users/search?${searchParams.toString()}`)
    const users = Array.isArray(data) ? data : (Array.isArray(data.users) ? data.users : [])

    return (users as Array<Record<string, unknown>>).map((raw) => {
      const uid = (typeof raw.uid === 'string' ? raw.uid : '') as UserResourceUid
      const realNameRaw = raw.realName ?? raw.real_name
      return {
        uid,
        nickname: typeof raw.nickname === 'string' ? raw.nickname.trim() : '',
        realName:
          typeof realNameRaw === 'string' && realNameRaw.trim().length > 0 ? realNameRaw.trim() : null,
        avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : null,
      }
    })
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new UserApiError(error.code, error.message)
    }
    throw error
  }
}

export type { UserPublicPreviewDto } from './types'
