import { HttpApiError, getApi } from '../http'
import { getUserUid, setUserUid } from '../../auth/tokenStorage'
import { isUserResourceUid, normalizeUserResourceUid } from '../resourceUid'
import type { UserResourceUid } from '../resourceUid'
import type {
  UserProfileHomeData,
  UserProfileMenuData,
  UserProfileNotesData,
  UserProfileProjectsData,
  UserProfileSpaceData,
} from './types'

// 01.1）个人空间主页预览条数（与 profileSpacePageData 保持一致，供 API 默认参数使用）
export const USER_PROFILE_HOME_PROJECT_LIMIT = 3
export const USER_PROFILE_HOME_NOTE_LIMIT = 4

// 01）用户资料接口异常类型定义（UserProfileApiError）
export class UserProfileApiError extends HttpApiError { }

// 02）用户资料缓存键常量（USER_PROFILE_MENU_CACHE_KEY）
const USER_PROFILE_MENU_CACHE_KEY = 'user_profile_menu_cache'

// 02.1）菜单缓存结构（UserProfileMenuCachePayload）
interface UserProfileMenuCachePayload {
  user_uid?: UserResourceUid
  /** @deprecated 旧版缓存字段 */
  uid?: UserResourceUid
  /** @deprecated 旧版缓存字段（可能为数字 id 或字符串 uid） */
  userId?: unknown
  data: UserProfileMenuData
}

// 02.2）归一化菜单接口响应（normalizeUserProfileMenuData）
/**
 * 函数名：normalizeUserProfileMenuData
 * 功能：将 /user-profile/menu 响应中的用户标识统一映射为 uid 字段。
 * 输入：
 * - raw：接口原始 data
 * 输出：
 * - 返回值：UserProfileMenuData
 * - 副作用：无
 */
function normalizeUserProfileMenuData(raw: UserProfileMenuData & Record<string, unknown>): UserProfileMenuData {
  const uid = normalizeUserResourceUid(raw) ?? raw.uid
  return {
    nickname: raw.nickname,
    level: raw.level,
    avatarUrl: raw.avatarUrl,
    verifiedOrganization: raw.verifiedOrganization,
    verifyStatus: raw.verifyStatus ?? raw.verify_status ?? null,
    uid,
  }
}

// 02.2.1）归一化个人空间页壳响应（normalizeUserProfileSpaceData）
/**
 * 函数名：normalizeUserProfileSpaceData
 * 功能：将 /user-profile/space 响应中的 userUid 等字段统一映射为 uid。
 * 输入：
 * - raw：接口原始 data
 * 输出：
 * - 返回值：UserProfileSpaceData
 * - 副作用：无
 */
function normalizeUserProfileSpaceData(raw: UserProfileSpaceData & Record<string, unknown>): UserProfileSpaceData {
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

// 02.2.2）归一化带 uid 的用户资料响应（normalizeUserProfileUidResponse）
/**
 * 函数名：normalizeUserProfileUidResponse
 * 功能：将 home/projects/notes 等响应顶层的 userUid 统一映射为 uid。
 * 输入：
 * - raw：含 uid 字段的接口 data
 * 输出：
 * - 返回值：归一化后的同类型对象
 * - 副作用：无
 */
function normalizeUserProfileUidResponse<T extends { uid: UserResourceUid }>(
  raw: T & Record<string, unknown>,
): T {
  const uid = normalizeUserResourceUid(raw) ?? raw.uid
  return {
    ...raw,
    uid,
  }
}

// 02.3）解析菜单缓存中的 user_uid（resolveMenuCacheUserUid）
/**
 * 函数名：resolveMenuCacheUserUid
 * 功能：从菜单 localStorage 缓存中解析 user_uid，兼容旧版 uid / userId 字段。
 * 输入：
 * - payload：解析后的缓存对象
 * 输出：
 * - 返回值：UserResourceUid | null
 * - 副作用：无
 */
function resolveMenuCacheUserUid(payload: UserProfileMenuCachePayload): UserResourceUid | null {
  if (payload.user_uid && isUserResourceUid(payload.user_uid)) {
    return payload.user_uid.trim()
  }

  if (payload.uid && isUserResourceUid(payload.uid)) {
    return payload.uid.trim()
  }

  return normalizeUserResourceUid(payload as unknown as Record<string, unknown>)
}

// 02.4）持久化 user_uid 到 tokenStorage（persistUserUidIfValid）
/**
 * 函数名：persistUserUidIfValid
 * 功能：在菜单缓存读写或接口返回后，将有效 uid 同步写入 localStorage.user_uid。
 * 输入：
 * - uid：用户对外 uid
 * 输出：
 * - 返回值：void
 * - 副作用：写入 localStorage
 */
function persistUserUidIfValid(uid: UserResourceUid | null | undefined): void {
  if (uid && isUserResourceUid(uid)) {
    setUserUid(uid)
  }
}

// 03）用户资料 GET 请求封装（getUserProfileApi）
/**
 * 函数名：getUserProfileApi
 * 功能：通过统一 axios 拦截器发送用户资料模块 GET 请求。
 * 实现方法：
 * - 调用 api/http.ts 暴露的 getApi 方法
 * - 将 HttpApiError 映射为 UserProfileApiError，便于业务侧区分来源
 * - 返回解包后的 data 数据
 * 输入：
 * - path：接口相对路径（以 / 开头）
 * 输出：
 * - 返回值：业务数据（泛型 TData）
 * - 副作用：发起网络请求
 */
// 03.1）拼接用户资料查询路径（buildUserProfileQueryPath）
/**
 * 函数名：buildUserProfileQueryPath
 * 功能：为个人空间相关 GET 接口拼接 uid 与其它查询参数。
 * 实现方法：
 * - 从 localStorage 读取 user_uid 写入查询串
 * - 合并调用方传入的额外参数
 * 输入：
 * - basePath：接口相对路径
 * - extraParams：额外查询参数
 * 输出：
 * - 返回值：带查询串的完整路径
 * - 副作用：无
 */
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

// 04）读取本地缓存的用户菜单数据（getCachedUserProfileMenu）
/**
 * 函数名：getCachedUserProfileMenu
 * 功能：读取本地缓存的顶部用户菜单数据，并校验 uid 一致性。
 * 实现方法：
 * - 从 localStorage 读取 JSON 缓存
 * - 解析后校验缓存中的 uid 与当前 uid 是否一致
 * - 校验通过返回缓存 data，否则返回 null
 * 输入：
 * - uid：当前登录用户 uid，可选
 * 输出：
 * - 返回值：UserProfileMenuData | null
 * - 副作用：读取 localStorage
 */
export function getCachedUserProfileMenu(uid?: UserResourceUid | null): UserProfileMenuData | null {
  const rawCache = window.localStorage.getItem(USER_PROFILE_MENU_CACHE_KEY)
  if (!rawCache) {
    return null
  }
  try {
    const parsedCache = JSON.parse(rawCache) as UserProfileMenuCachePayload
    const cachedUserUid = resolveMenuCacheUserUid(parsedCache)
    if (!parsedCache?.data || !cachedUserUid) {
      return null
    }
    if (uid && cachedUserUid !== uid) {
      return null
    }

    persistUserUidIfValid(cachedUserUid)
    return normalizeUserProfileMenuData({
      ...parsedCache.data,
      uid: cachedUserUid,
    } as UserProfileMenuData & Record<string, unknown>)
  } catch {
    return null
  }
}

// 05）写入本地缓存的用户菜单数据（setCachedUserProfileMenu）
/**
 * 函数名：setCachedUserProfileMenu
 * 功能：将最新用户菜单数据写入 localStorage 缓存。
 * 实现方法：
 * - 使用 user_uid + data 组合写入统一缓存键
 * - 同步写入 localStorage.user_uid
 * - 写入前校验 uid 为非空字符串
 * - 覆盖旧缓存，保证刷新后读取的是最新结构
 * 输入：
 * - uid：当前登录用户 uid
 * - data：用户菜单接口返回数据
 * 输出：
 * - 返回值：void
 * - 副作用：写入 localStorage
 */
export function setCachedUserProfileMenu(uid: UserResourceUid, data: UserProfileMenuData): void {
  if (!isUserResourceUid(uid)) {
    return
  }

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

// 06）清理本地缓存的用户菜单数据（clearCachedUserProfileMenu）
/**
 * 函数名：clearCachedUserProfileMenu
 * 功能：清理本地缓存的顶部用户菜单数据。
 * 实现方法：
 * - 删除 user_profile_menu_cache 键
 * 输入：无
 * 输出：
 * - 返回值：void
 * - 副作用：删除 localStorage
 */
export function clearCachedUserProfileMenu(): void {
  window.localStorage.removeItem(USER_PROFILE_MENU_CACHE_KEY)
}

// 07）获取顶部用户菜单数据接口（getUserProfileMenu）
/**
 * 函数名：getUserProfileMenu
 * 功能：获取顶部导航 UserProfileMenu 组件所需的用户资料数据。
 * 实现方法：
 * - 从本地读取 uid 并拼接请求参数（用于后端识别当前用户）
 * - 调用 /user-profile/menu 接口读取头像、昵称、等级与主体认证信息
 * - 复用统一鉴权拦截器自动注入 accessToken
 * - 返回可直接渲染到 UserProfileMenu 的数据结构
 * 输入：无
 * 输出：
 * - 返回值：UserProfileMenuData
 * - 副作用：发起网络请求
 */
export async function getUserProfileMenu(): Promise<UserProfileMenuData> {
  const rawMenuData = await getUserProfileApi<UserProfileMenuData & Record<string, unknown>>(
    buildUserProfileQueryPath('/user-profile/menu'),
  )
  const menuData = normalizeUserProfileMenuData(rawMenuData)
  persistUserUidIfValid(menuData.uid)
  return menuData
}

// 08）获取个人空间页壳数据接口（getUserProfileSpace）
/**
 * 函数名：getUserProfileSpace
 * 功能：获取个人空间 Hero 区与右侧信息侧栏所需的页壳数据。
 * 实现方法：
 * - 从 profileUid 或本地 uid 拼接查询参数
 * - 调用 GET /user-profile/space 接口
 * - 复用统一鉴权拦截器自动注入 accessToken
 * 输入：
 * - profileUid：目标用户 uid；缺省时读取当前登录用户 uid
 * 输出：
 * - 返回值：UserProfileSpaceData
 * - 副作用：发起网络请求
 */
export async function getUserProfileSpace(profileUid?: UserResourceUid): Promise<UserProfileSpaceData> {
  const rawSpaceData = await getUserProfileApi<UserProfileSpaceData & Record<string, unknown>>(
    buildUserProfileQueryPath('/user-profile/space', undefined, profileUid),
  )
  return normalizeUserProfileSpaceData(rawSpaceData)
}

// 09）获取个人空间主页 Tab 数据（getUserProfileHome）
/**
 * 函数名：getUserProfileHome
 * 功能：获取个人空间「主页」Tab 的项目与笔记预览列表。
 * 实现方法：
 * - 调用 GET /user-profile/home
 * - 支持 projectLimit、noteLimit 查询参数
 * 输入：
 * - options.profileUid：目标用户 uid（优先于 localStorage；应与 space 页壳一致）
 * - options.projectLimit：项目预览条数，默认 3
 * - options.noteLimit：笔记预览条数，默认 4
 * 输出：
 * - 返回值：UserProfileHomeData
 * - 副作用：发起网络请求
 */
export async function getUserProfileHome(options?: {
  profileUid?: UserResourceUid
  projectLimit?: number
  noteLimit?: number
}): Promise<UserProfileHomeData> {
  const rawHomeData = await getUserProfileApi<UserProfileHomeData & Record<string, unknown>>(
    buildUserProfileQueryPath(
      '/user-profile/home',
      {
        projectLimit: options?.projectLimit ?? USER_PROFILE_HOME_PROJECT_LIMIT,
        noteLimit: options?.noteLimit ?? USER_PROFILE_HOME_NOTE_LIMIT,
      },
      options?.profileUid,
    ),
  )
  return normalizeUserProfileUidResponse(rawHomeData)
}

// 10）获取个人空间项目 Tab 数据（getUserProfileProjects）
/**
 * 函数名：getUserProfileProjects
 * 功能：获取个人空间「项目」Tab 的项目列表（分页）。
 * 实现方法：
 * - 调用 GET /user-profile/projects
 * - 支持 page、pageSize 查询参数
 * 输入：
 * - options.page：页码，默认 1
 * - options.pageSize：每页条数，默认 20
 * 输出：
 * - 返回值：UserProfileProjectsData
 * - 副作用：发起网络请求
 */
export async function getUserProfileProjects(options?: {
  page?: number
  pageSize?: number
  profileUid?: UserResourceUid
}): Promise<UserProfileProjectsData> {
  const rawProjectsData = await getUserProfileApi<UserProfileProjectsData & Record<string, unknown>>(
    buildUserProfileQueryPath(
      '/user-profile/projects',
      {
        page: options?.page ?? 1,
        pageSize: options?.pageSize ?? 20,
      },
      options?.profileUid,
    ),
  )
  return normalizeUserProfileUidResponse(rawProjectsData)
}

// 11）获取个人空间笔记 Tab 数据（getUserProfileNotes）
/**
 * 函数名：getUserProfileNotes
 * 功能：获取个人空间「笔记」Tab 的笔记列表（分页，可选内容类型预筛）。
 * 实现方法：
 * - 调用 GET /user-profile/notes
 * - 支持 page、pageSize、contentType 查询参数
 * 输入：
 * - options.page：页码，默认 1
 * - options.pageSize：每页条数，默认 20
 * - options.contentType：服务端预筛类型，可选
 * 输出：
 * - 返回值：UserProfileNotesData
 * - 副作用：发起网络请求
 */
export async function getUserProfileNotes(options?: {
  page?: number
  pageSize?: number
  contentType?: '图文' | '视频'
  profileUid?: UserResourceUid
}): Promise<UserProfileNotesData> {
  const rawNotesData = await getUserProfileApi<UserProfileNotesData & Record<string, unknown>>(
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
  return normalizeUserProfileUidResponse(rawNotesData)
}

export type {
  UserProfileHomeData,
  UserProfileMenuData,
  UserProfileNoteDto,
  UserProfileNotesData,
  UserProfileProjectDto,
  UserProfileProjectsData,
  UserProfileSpaceAssociatedTeam,
  UserProfileSpaceBaseInfo,
  UserProfileSpaceData,
  UserProfileSpaceExtendInfo,
} from './types'
