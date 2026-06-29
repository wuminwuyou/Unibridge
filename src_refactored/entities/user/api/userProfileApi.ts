// 01）个人空间页 API（entities/user/api/userProfileApi）
import { HttpApiError, getApi } from '@shared/api/http'
import {
  isUserResourceUid, normalizeUserResourceUid, type UserResourceUid,
} from '@shared/api/resourceUid'
import { getUserUid, setUserUid } from '@shared/lib/tokenStorage'
import type {
  UserProfileHomeData, UserProfileMenuData, UserProfileNotesData,
  UserProfileProjectsData, UserProfileSpaceData,
} from '../model/userProfileTypes'

// 02）个人空间预览条数（USER_PROFILE_HOME_*_LIMIT）
export const USER_PROFILE_HOME_PROJECT_LIMIT = 3
export const USER_PROFILE_HOME_NOTE_LIMIT = 4

// 03）个人空间接口异常类型（UserProfileApiError）
export class UserProfileApiError extends HttpApiError {}

// 04）菜单本地缓存键（USER_PROFILE_MENU_CACHE_KEY）
const USER_PROFILE_MENU_CACHE_KEY = 'user_profile_menu_cache'

interface UserProfileMenuCachePayload {
  user_uid?: UserResourceUid
  uid?: UserResourceUid
  userId?: unknown
  data: UserProfileMenuData
}

// 05）归一化菜单响应（normalizeUserProfileMenuData）
function normalizeUserProfileMenuData(raw: UserProfileMenuData & Record<string, unknown>): UserProfileMenuData {
  const uid = normalizeUserResourceUid(raw) ?? raw.uid
  return {
    nickname: raw.nickname,
    level: raw.level,
    avatarUrl: raw.avatarUrl,
    verifiedOrganization: raw.verifiedOrganization,
    verifyStatus: raw.verifyStatus ?? (raw.verify_status as string | undefined) ?? null,
    uid: uid as UserResourceUid,
  }
}

// 06）归一化空间页响应（normalizeUserProfileSpaceData）
function normalizeUserProfileSpaceData(
  raw: UserProfileSpaceData & Record<string, unknown>,
): UserProfileSpaceData {
  const uid =
    normalizeUserResourceUid(raw) ??
    normalizeUserResourceUid(raw.baseInfo as unknown as Record<string, unknown>) ??
    raw.uid ??
    raw.baseInfo?.uid ??
    ''

  return {
    ...raw,
    uid,
    baseInfo: {
      ...raw.baseInfo,
      uid,
    },
  }
}

// 07）归一化带 uid 的响应（normalizeUserProfileUidResponse）
function normalizeUserProfileUidResponse<T extends { uid: UserResourceUid }>(
  raw: T & Record<string, unknown>,
): T {
  const uid = normalizeUserResourceUid(raw) ?? raw.uid
  return { ...raw, uid }
}

// 08）从菜单缓存读取 user_uid（resolveMenuCacheUserUid）
function resolveMenuCacheUserUid(payload: UserProfileMenuCachePayload): UserResourceUid | null {
  if (payload.user_uid && isUserResourceUid(payload.user_uid)) return payload.user_uid.trim()
  if (payload.uid && isUserResourceUid(payload.uid)) return payload.uid.trim()
  return normalizeUserResourceUid(payload as unknown as Record<string, unknown>)
}

// 09）有效时持久化 user_uid（persistUserUidIfValid）
function persistUserUidIfValid(uid: UserResourceUid | null | undefined): void {
  if (uid && isUserResourceUid(uid)) setUserUid(uid)
}

// 10）拼接查询参数（buildUserProfileQueryPath）
function buildUserProfileQueryPath(
  basePath: string,
  extraParams?: Record<string, string | number | undefined>,
  profileUid?: UserResourceUid,
): string {
  const searchParams = new URLSearchParams()
  const resolvedUid = profileUid ?? getUserUid()
  if (resolvedUid && isUserResourceUid(resolvedUid)) {
    searchParams.set('uid', resolvedUid)
  }
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value))
      }
    }
  }
  const query = searchParams.toString()
  return query ? `${basePath}?${query}` : basePath
}

// 11）GET 请求封装（getUserProfileApi）
async function getUserProfileApi<TData>(path: string): Promise<TData> {
  try {
    return await getApi<TData>(path)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new UserProfileApiError(error.code, error.message)
    }
    throw error
  }
}

// 12）读取本地缓存菜单（getCachedUserProfileMenu）
export function getCachedUserProfileMenu(uid?: UserResourceUid | null): UserProfileMenuData | null {
  const rawCache = window.localStorage.getItem(USER_PROFILE_MENU_CACHE_KEY)
  if (!rawCache) return null
  try {
    const parsed = JSON.parse(rawCache) as UserProfileMenuCachePayload
    const cachedUid = resolveMenuCacheUserUid(parsed)
    if (!parsed?.data || !cachedUid) return null
    if (uid && cachedUid !== uid) return null
    persistUserUidIfValid(cachedUid)
    return normalizeUserProfileMenuData({
      ...parsed.data,
      uid: cachedUid,
    } as UserProfileMenuData & Record<string, unknown>)
  } catch {
    return null
  }
}

// 13）写入本地缓存菜单（setCachedUserProfileMenu）
export function setCachedUserProfileMenu(uid: UserResourceUid, data: UserProfileMenuData): void {
  if (!isUserResourceUid(uid)) return
  const normalizedUid = uid.trim()
  persistUserUidIfValid(normalizedUid)
  window.localStorage.setItem(
    USER_PROFILE_MENU_CACHE_KEY,
    JSON.stringify({
      user_uid: normalizedUid,
      data: normalizeUserProfileMenuData({
        ...data,
        uid: normalizedUid,
      } as UserProfileMenuData & Record<string, unknown>),
    } satisfies UserProfileMenuCachePayload),
  )
}

// 14）清理本地缓存菜单（clearCachedUserProfileMenu）
export function clearCachedUserProfileMenu(): void {
  window.localStorage.removeItem(USER_PROFILE_MENU_CACHE_KEY)
}

// 15）获取顶部菜单（getUserProfileMenu）
/**
 * 函数名：getUserProfileMenu
 * 功能：获取 TopNavbar 用户菜单所需的资料数据。
 * 实现方法：
 * - 拼接 ?uid= 调用 /user-profile/menu
 * - 拦截器自动注入 accessToken
 * 输入：无
 * 输出：
 * - 返回值：UserProfileMenuData
 * - 副作用：发起网络请求；persistUserUidIfValid 写入 localStorage
 */
export async function getUserProfileMenu(): Promise<UserProfileMenuData> {
  const raw = await getUserProfileApi<UserProfileMenuData & Record<string, unknown>>(
    buildUserProfileQueryPath('/user-profile/menu'),
  )
  const menu = normalizeUserProfileMenuData(raw)
  persistUserUidIfValid(menu.uid)
  return menu
}

// 16）获取个人空间页壳（getUserProfileSpace）
/**
 * 函数名：getUserProfileSpace
 * 功能：拉取个人空间 Hero / 侧栏数据。
 * 实现方法：
 * - 优先使用调用方传入的 profileUid；缺省读取 tokenStorage 中的 user_uid
 * - 调用 GET /user-profile/space?uid=
 * 输入：
 * - profileUid：目标用户 uid，可选
 * 输出：
 * - 返回值：UserProfileSpaceData
 * - 副作用：发起网络请求
 */
export async function getUserProfileSpace(profileUid?: UserResourceUid): Promise<UserProfileSpaceData> {
  const raw = await getUserProfileApi<UserProfileSpaceData & Record<string, unknown>>(
    buildUserProfileQueryPath('/user-profile/space', undefined, profileUid),
  )
  return normalizeUserProfileSpaceData(raw)
}

// 17）获取主页 Tab 数据（getUserProfileHome）
export async function getUserProfileHome(options?: {
  profileUid?: UserResourceUid
  projectLimit?: number
  noteLimit?: number
}): Promise<UserProfileHomeData> {
  const raw = await getUserProfileApi<UserProfileHomeData & Record<string, unknown>>(
    buildUserProfileQueryPath(
      '/user-profile/home',
      {
        projectLimit: options?.projectLimit ?? USER_PROFILE_HOME_PROJECT_LIMIT,
        noteLimit: options?.noteLimit ?? USER_PROFILE_HOME_NOTE_LIMIT,
      },
      options?.profileUid,
    ),
  )
  return normalizeUserProfileUidResponse(raw)
}

// 18）获取项目 Tab 数据（getUserProfileProjects）
export async function getUserProfileProjects(options?: {
  page?: number
  pageSize?: number
  profileUid?: UserResourceUid
}): Promise<UserProfileProjectsData> {
  const raw = await getUserProfileApi<UserProfileProjectsData & Record<string, unknown>>(
    buildUserProfileQueryPath(
      '/user-profile/projects',
      { page: options?.page ?? 1, pageSize: options?.pageSize ?? 20 },
      options?.profileUid,
    ),
  )
  return normalizeUserProfileUidResponse(raw)
}

// 19）获取笔记 Tab 数据（getUserProfileNotes）
export async function getUserProfileNotes(options?: {
  page?: number
  pageSize?: number
  contentType?: '图文' | '视频'
  profileUid?: UserResourceUid
}): Promise<UserProfileNotesData> {
  const raw = await getUserProfileApi<UserProfileNotesData & Record<string, unknown>>(
    buildUserProfileQueryPath(
      '/user-profile/notes',
      {
        page: options?.page ?? 1,
        pageSize: options?.pageSize ?? 20,
        contentType: options?.contentType,
      },
      options?.profileUid,
    ),
  )
  return normalizeUserProfileUidResponse(raw)
}

export type {
  UserProfileHomeData, UserProfileMenuData, UserProfileNoteDto, UserProfileNotesData,
  UserProfileProjectDto, UserProfileProjectsData, UserProfileSpaceAssociatedTeam,
  UserProfileSpaceBaseInfo, UserProfileSpaceData, UserProfileSpaceExtendInfo,
} from '../model/userProfileTypes'
