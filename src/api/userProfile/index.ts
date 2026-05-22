import { HttpApiError, getApi } from '../http'
import { getUserId } from '../../auth/tokenStorage'
import type {
  UserProfileHomeData,
  UserProfileMenuData,
  UserProfileNotesData,
  UserProfileProjectsData,
  UserProfileSpaceData,
} from './types'

// 01）用户资料接口异常类型定义（UserProfileApiError）
export class UserProfileApiError extends HttpApiError {}

// 02）用户资料缓存键常量（USER_PROFILE_MENU_CACHE_KEY）
const USER_PROFILE_MENU_CACHE_KEY = 'user_profile_menu_cache'

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
 * 功能：为个人空间相关 GET 接口拼接 userId 与其它查询参数。
 * 实现方法：
 * - 从 localStorage 读取 userId 写入查询串
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
): string {
  const searchParams = new URLSearchParams()
  const currentUserId = getUserId()

  if (currentUserId && Number.isInteger(currentUserId)) {
    searchParams.set('userId', String(currentUserId))
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
 * 功能：读取本地缓存的顶部用户菜单数据，并校验 userId 一致性。
 * 实现方法：
 * - 从 localStorage 读取 JSON 缓存
 * - 解析后校验缓存中的 userId 与当前 userId 是否一致
 * - 校验通过返回缓存 data，否则返回 null
 * 输入：
 * - userId：当前登录用户 ID，可选
 * 输出：
 * - 返回值：UserProfileMenuData | null
 * - 副作用：读取 localStorage
 */
export function getCachedUserProfileMenu(userId?: number | null): UserProfileMenuData | null {
  const rawCache = window.localStorage.getItem(USER_PROFILE_MENU_CACHE_KEY)
  if (!rawCache) {
    return null
  }
  try {
    const parsedCache = JSON.parse(rawCache) as { userId: number; data: UserProfileMenuData }
    if (!parsedCache?.data || !parsedCache?.userId) {
      return null
    }
    if (userId && parsedCache.userId !== userId) {
      return null
    }
    return parsedCache.data
  } catch {
    return null
  }
}

// 05）写入本地缓存的用户菜单数据（setCachedUserProfileMenu）
/**
 * 函数名：setCachedUserProfileMenu
 * 功能：将最新用户菜单数据写入 localStorage 缓存。
 * 实现方法：
 * - 使用 userId + data 组合写入统一缓存键
 * - 写入前校验 userId 为正整数
 * - 覆盖旧缓存，保证刷新后读取的是最新结构
 * 输入：
 * - userId：当前登录用户 ID
 * - data：用户菜单接口返回数据
 * 输出：
 * - 返回值：void
 * - 副作用：写入 localStorage
 */
export function setCachedUserProfileMenu(userId: number, data: UserProfileMenuData): void {
  if (!Number.isInteger(userId) || userId <= 0) {
    return
  }
  window.localStorage.setItem(
    USER_PROFILE_MENU_CACHE_KEY,
    JSON.stringify({
      userId,
      data,
    }),
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
 * - 从本地读取 userId 并拼接请求参数（用于后端识别当前用户）
 * - 调用 /user-profile/menu 接口读取头像、昵称、等级与主体认证信息
 * - 复用统一鉴权拦截器自动注入 accessToken
 * - 返回可直接渲染到 UserProfileMenu 的数据结构
 * 输入：无
 * 输出：
 * - 返回值：UserProfileMenuData
 * - 副作用：发起网络请求
 */
export async function getUserProfileMenu(): Promise<UserProfileMenuData> {
  return getUserProfileApi<UserProfileMenuData>(buildUserProfileQueryPath('/user-profile/menu'))
}

// 08）获取个人空间页壳数据接口（getUserProfileSpace）
/**
 * 函数名：getUserProfileSpace
 * 功能：获取个人空间 Hero 区与右侧信息侧栏所需的页壳数据。
 * 实现方法：
 * - 从本地读取 userId 并拼接查询参数
 * - 调用 GET /user-profile/space 接口
 * - 复用统一鉴权拦截器自动注入 accessToken
 * 输入：无
 * 输出：
 * - 返回值：UserProfileSpaceData
 * - 副作用：发起网络请求
 */
export async function getUserProfileSpace(): Promise<UserProfileSpaceData> {
  return getUserProfileApi<UserProfileSpaceData>(buildUserProfileQueryPath('/user-profile/space'))
}

// 09）获取个人空间主页 Tab 数据（getUserProfileHome）
/**
 * 函数名：getUserProfileHome
 * 功能：获取个人空间「主页」Tab 的项目与笔记预览列表。
 * 实现方法：
 * - 调用 GET /user-profile/home
 * - 支持 projectLimit、noteLimit 查询参数
 * 输入：
 * - options.projectLimit：项目预览条数，默认 4
 * - options.noteLimit：笔记预览条数，默认 3
 * 输出：
 * - 返回值：UserProfileHomeData
 * - 副作用：发起网络请求
 */
export async function getUserProfileHome(options?: {
  projectLimit?: number
  noteLimit?: number
}): Promise<UserProfileHomeData> {
  return getUserProfileApi<UserProfileHomeData>(
    buildUserProfileQueryPath('/user-profile/home', {
      projectLimit: options?.projectLimit ?? 4,
      noteLimit: options?.noteLimit ?? 3,
    }),
  )
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
}): Promise<UserProfileProjectsData> {
  return getUserProfileApi<UserProfileProjectsData>(
    buildUserProfileQueryPath('/user-profile/projects', {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 20,
    }),
  )
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
}): Promise<UserProfileNotesData> {
  return getUserProfileApi<UserProfileNotesData>(
    buildUserProfileQueryPath('/user-profile/notes', {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 20,
      contentType: options?.contentType,
    }),
  )
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
