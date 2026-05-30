import { HttpApiError, getApi, postApi, putApi, deleteApi } from '../http'
import type { EntityCode } from '../resourceUid'
import type { UserPublicPreviewDto } from '../users/types'
import type {
  AddEntityMemberRequest,
  AddEntityMemberResponse,
  CreateEntityTeamRequest,
  CreateEntityTeamResponse,
  EntityProfileHomeData,
  EntityProfileMembersData,
  EntityProfileNotesData,
  EntityProfileProjectsData,
  EntityProfileSpaceData,
  EntityProfileTeamsData,
  RemoveEntityMemberRequest,
  UpdateEntityTeamRequest,
} from './types'
import {
  normalizeEntityProfileHomeData,
  normalizeEntityProfileMembersData,
  normalizeEntityProfileNotesData,
  normalizeEntityProfileProjectsData,
  normalizeEntityProfileSpaceData,
  normalizeEntityProfileTeamsData,
} from './normalizeEntityProfileData'
import { normalizeEntityProfileMenuData } from './normalizeEntityProfileMenuData'
import type { EntityProfileMenuData } from './menuTypes'
import {
  ENTITY_PROFILE_HOME_MEMBER_LIMIT,
  ENTITY_PROFILE_HOME_NOTE_LIMIT,
  ENTITY_PROFILE_HOME_PROJECT_LIMIT,
  ENTITY_PROFILE_HOME_TEAM_LIMIT,
} from './constants'

// 01）机构资料接口异常类型（EntityProfileApiError）
export class EntityProfileApiError extends HttpApiError {}

// 02）拼接机构资料查询路径（buildEntityProfileQueryPath）
/**
 * 函数名：buildEntityProfileQueryPath
 * 功能：为机构空间 GET 接口拼接 entityCode 与其它查询参数。
 * 输入：
 * - entityCode：机构主体代码
 * - basePath：接口相对路径
 * - extraParams：额外查询参数
 * 输出：
 * - 返回值：带查询串的完整路径
 * - 副作用：无
 */
function buildEntityProfileQueryPath(
  entityCode: EntityCode,
  basePath: string,
  extraParams?: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams()
  searchParams.set('entityCode', entityCode)

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== undefined && value !== null && value !== '' && value !== 0) {
        searchParams.set(key, String(value))
      }
    }
  }

  return `${basePath}?${searchParams.toString()}`
}

// 03）机构资料 GET 请求封装（getEntityProfileApi）
/**
 * 函数名：getEntityProfileApi
 * 功能：通过统一 axios 拦截器发送机构资料模块 GET 请求。
 * 输入：
 * - path：含查询串的相对路径
 * 输出：
 * - 返回值：业务 data
 * - 副作用：发起网络请求
 */
async function getEntityProfileApi<TData>(path: string): Promise<TData> {
  try {
    return await getApi<TData>(path)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new EntityProfileApiError(error.code, error.message)
    }
    throw error
  }
}

// 04）获取机构空间页壳（getEntityProfileSpace）
/**
 * 函数名：getEntityProfileSpace
 * 功能：获取机构 Hero、侧栏与实验室预览数据。
 * 输入：
 * - entityCode：机构主体代码
 * 输出：
 * - 返回值：EntityProfileSpaceData
 * - 副作用：发起网络请求
 */
export async function getEntityProfileSpace(entityCode: EntityCode): Promise<EntityProfileSpaceData> {
  const data = await getEntityProfileApi<EntityProfileSpaceData & Record<string, unknown>>(
    buildEntityProfileQueryPath(entityCode, '/entity-profile/space'),
  )
  return normalizeEntityProfileSpaceData(data)
}

// 05）获取机构主页 Tab 数据（getEntityProfileHome）
/**
 * 函数名：getEntityProfileHome
 * 功能：获取机构主页的项目/笔记/实验室预览列表。
 * 输入：
 * - entityCode：机构主体代码
 * - options：预览条数上限
 * 输出：
 * - 返回值：EntityProfileHomeData
 * - 副作用：发起网络请求
 */
export async function getEntityProfileHome(
  entityCode: EntityCode,
  options?: {
    teamLimit?: number
    memberLimit?: number
    projectLimit?: number
    noteLimit?: number
  },
): Promise<EntityProfileHomeData> {
  const data = await getEntityProfileApi<EntityProfileHomeData & Record<string, unknown>>(
    buildEntityProfileQueryPath(entityCode, '/entity-profile/home', {
      teamLimit: options?.teamLimit,
      memberLimit: options?.memberLimit ?? ENTITY_PROFILE_HOME_MEMBER_LIMIT,
      projectLimit: options?.projectLimit ?? ENTITY_PROFILE_HOME_PROJECT_LIMIT,
      noteLimit: options?.noteLimit ?? ENTITY_PROFILE_HOME_NOTE_LIMIT,
    }),
  )
  return normalizeEntityProfileHomeData(data)
}

// 06）获取机构实验室列表（getEntityProfileTeams）
/**
 * 函数名：getEntityProfileTeams
 * 功能：获取机构「实验室」Tab 分页列表。
 * 输入：
 * - entityCode：机构主体代码
 * - options：分页参数
 * 输出：
 * - 返回值：EntityProfileTeamsData
 * - 副作用：发起网络请求
 */
export async function getEntityProfileTeams(
  entityCode: EntityCode,
  options?: { page?: number; pageSize?: number },
): Promise<EntityProfileTeamsData> {
  const data = await getEntityProfileApi<EntityProfileTeamsData & Record<string, unknown>>(
    buildEntityProfileQueryPath(entityCode, '/entity-profile/teams', {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 20,
    }),
  )
  return normalizeEntityProfileTeamsData(data)
}

// 09）获取机构人员列表（getEntityProfileMembers）
/**
 * 函数名：getEntityProfileMembers
 * 功能：获取机构「人员」Tab 分页列表（user_auth_link 关联用户）。
 * 输入：
 * - entityCode：机构主体代码
 * - options：分页参数
 * 输出：
 * - 返回值：EntityProfileMembersData
 * - 副作用：发起网络请求
 */
export async function getEntityProfileMembers(
  entityCode: EntityCode,
  options?: { page?: number; pageSize?: number },
): Promise<EntityProfileMembersData> {
  const data = await getEntityProfileApi<EntityProfileMembersData & Record<string, unknown>>(
    buildEntityProfileQueryPath(entityCode, '/entity-profile/members', {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 20,
    }),
  )
  return normalizeEntityProfileMembersData(data)
}

// 10）获取机构项目列表（getEntityProfileProjects）
/**
 * 函数名：getEntityProfileProjects
 * 功能：获取机构「项目」Tab 分页列表。
 * 输入：
 * - entityCode：机构主体代码
 * - options：分页参数
 * 输出：
 * - 返回值：EntityProfileProjectsData
 * - 副作用：发起网络请求
 */
export async function getEntityProfileProjects(
  entityCode: EntityCode,
  options?: { page?: number; pageSize?: number },
): Promise<EntityProfileProjectsData> {
  const data = await getEntityProfileApi<EntityProfileProjectsData & Record<string, unknown>>(
    buildEntityProfileQueryPath(entityCode, '/entity-profile/projects', {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 20,
    }),
  )
  return normalizeEntityProfileProjectsData(data)
}

// 11）获取机构笔记列表（getEntityProfileNotes）
/**
 * 函数名：getEntityProfileNotes
 * 功能：获取机构「笔记」Tab 分页列表。
 * 输入：
 * - entityCode：机构主体代码
 * - options：分页与内容类型筛选
 * 输出：
 * - 返回值：EntityProfileNotesData
 * - 副作用：发起网络请求
 */
export async function getEntityProfileNotes(
  entityCode: EntityCode,
  options?: {
    page?: number
    pageSize?: number
    contentType?: '图文' | '视频'
  },
): Promise<EntityProfileNotesData> {
  const data = await getEntityProfileApi<EntityProfileNotesData & Record<string, unknown>>(
    buildEntityProfileQueryPath(entityCode, '/entity-profile/notes', {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 21,
      contentType: options?.contentType,
    }),
  )
  return normalizeEntityProfileNotesData(data)
}

// 12）获取机构顶部用户菜单（getEntityProfileMenu）
/**
 * 函数名：getEntityProfileMenu
 * 功能：获取主体管理员登录后顶部 UserProfileMenu 所需资料。
 * 输入：
 * - entityCode：机构主体代码
 * 输出：
 * - 返回值：EntityProfileMenuData
 * - 副作用：发起网络请求
 */
export async function getEntityProfileMenu(entityCode: EntityCode): Promise<EntityProfileMenuData> {
  const data = await getEntityProfileApi<EntityProfileMenuData & Record<string, unknown>>(
    buildEntityProfileQueryPath(entityCode, '/entity-profile/menu'),
  )
  return normalizeEntityProfileMenuData(data)
}

// 13）获取用户模糊搜索（searchEntityProfileUsers）
/**
 * 函数名：searchEntityProfileUsers
 * 功能：按关键词模糊搜索用户，用于实验室负责人选择。
 * 输入：
 * - keyword：搜索关键词（匹配 uid / nickname / realName）
 * 输出：
 * - 返回值：用户列表
 * - 副作用：发起网络请求
 */
export async function searchEntityProfileUsers(keyword: string): Promise<UserPublicPreviewDto[]> {
  const { searchUsers } = await import('../users')
  return searchUsers(keyword)
}

// 14）创建机构下属团队（createEntityTeam）
/**
 * 函数名：createEntityTeam
 * 功能：在指定机构下创建新的下属实验室/团队。
 * 输入：
 * - body：创建请求体（entityCode, name, tags, description, leaderUid）
 * 输出：
 * - 返回值：创建结果（teamUid, name）
 * - 副作用：发起网络请求
 */
export async function createEntityTeam(
  body: CreateEntityTeamRequest,
): Promise<CreateEntityTeamResponse> {
  try {
    return await postApi<CreateEntityTeamRequest, CreateEntityTeamResponse>('/entity-profile/team', body)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new EntityProfileApiError(error.code, error.message)
    }
    throw error
  }
}

// 15）更新机构下属团队（updateEntityTeam）
/**
 * 函数名：updateEntityTeam
 * 功能：更新指定机构下属实验室的基本信息。
 * 输入：
 * - teamUid：团队对外 uid
 * - body：更新请求体
 * 输出：
 * - 返回值：void
 * - 副作用：发起网络请求
 */
export async function updateEntityTeam(
  teamUid: string,
  body: UpdateEntityTeamRequest,
): Promise<void> {
  try {
    await putApi<UpdateEntityTeamRequest, void>(
      `/entity-profile/team?teamUid=${encodeURIComponent(teamUid)}`,
      body,
    )
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new EntityProfileApiError(error.code, error.message)
    }
    throw error
  }
}

// 16）删除机构下属团队（deleteEntityTeam）
/**
 * 函数名：deleteEntityTeam
 * 功能：删除指定机构下的实验室/团队。
 * 输入：
 * - teamUid：团队对外 uid
 * 输出：
 * - 返回值：void
 * - 副作用：发起网络请求
 */
export async function deleteEntityTeam(teamUid: string): Promise<void> {
  try {
    await deleteApi<void>(`/entity-profile/team?teamUid=${encodeURIComponent(teamUid)}`)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new EntityProfileApiError(error.code, error.message)
    }
    throw error
  }
}

// 17）添加机构关联人员（addEntityProfileMember）
/**
 * 函数名：addEntityProfileMember
 * 功能：为机构添加一位关联人员（PM 或 MENTOR）。
 * 输入：
 * - body：entityCode 与 uid
 * 输出：
 * - 返回值：AddEntityProfileMemberResponse（uid, role）
 * - 副作用：发起网络请求
 */
export async function addEntityProfileMember(
  body: AddEntityMemberRequest,
): Promise<AddEntityMemberResponse> {
  try {
    return await postApi<AddEntityMemberRequest, AddEntityMemberResponse>('/entity-profile/member', body)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new EntityProfileApiError(error.code, error.message)
    }
    throw error
  }
}

// 18）移除机构关联人员（removeEntityProfileMember）
/**
 * 函数名：removeEntityProfileMember
 * 功能：从机构移除一位关联人员。
 * 输入：
 * - body：entityCode 与 uid
 * 输出：
 * - 返回值：void
 * - 副作用：发起网络请求
 */
export async function removeEntityProfileMember(body: RemoveEntityMemberRequest): Promise<void> {
  try {
    await deleteApi<void>(
      `/entity-profile/member?entityCode=${encodeURIComponent(body.entityCode)}&uid=${encodeURIComponent(body.uid)}`,
    )
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new EntityProfileApiError(error.code, error.message)
    }
    throw error
  }
}

export type { EntityProfileMenuData } from './menuTypes'

export type {
  AddEntityMemberRequest,
  AddEntityMemberResponse,
  EntityProfileCoreProfileDto,
  EntityProfileExtendedProfileDto,
  EntityProfileHomeData,
  EntityProfileInfoRowDto,
  EntityProfileMemberDto,
  EntityProfileMembersData,
  EntityProfileNotesData,
  EntityProfileProjectsData,
  EntityProfileSpaceData,
  EntityProfileTeamPreviewDto,
  EntityProfileTeamsData,
  EntityProfileType,
  OrgAuthRole,
  CreateEntityTeamRequest,
  CreateEntityTeamResponse,
  RemoveEntityMemberRequest,
  UpdateEntityTeamRequest,
} from './types'
