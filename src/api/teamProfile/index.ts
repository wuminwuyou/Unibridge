import { HttpApiError, getApi, putApi, postApi } from '../http'
import type { TeamResourceUid } from '../resourceUid'
import type {
  CreateStudentTeamRequest,
  CreateStudentTeamResponse,
  TeamProfileAchievementsData,
  TeamProfileHomeData,
  TeamProfileMembersData,
  TeamProfileNotesData,
  TeamProfileProjectsData,
  TeamProfileSpaceData,
  UpdateTeamProfileMembersRequest,
  UpdateTeamProfileMembersResponse,
} from './types'

// 01.1）团队主页预览默认条数（与 profileSpaceTabConstants 保持一致）
export const TEAM_PROFILE_HOME_PROJECT_LIMIT = 3
export const TEAM_PROFILE_HOME_NOTE_LIMIT = 3
export const TEAM_PROFILE_HOME_ACHIEVEMENT_LIMIT = 3

// 01）团队资料接口异常类型（TeamProfileApiError）
export class TeamProfileApiError extends HttpApiError {}

// 02）拼接团队资料查询路径（buildTeamProfileQueryPath）
/**
 * 函数名：buildTeamProfileQueryPath
 * 功能：为团队空间 GET 接口拼接 teamUid 与其它查询参数。
 * 输入：
 * - teamUid：团队对外 uid
 * - basePath：接口相对路径
 * - extraParams：额外查询参数
 * 输出：
 * - 返回值：带查询串的完整路径
 * - 副作用：无
 */
function buildTeamProfileQueryPath(
  teamUid: TeamResourceUid,
  basePath: string,
  extraParams?: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams()
  searchParams.set('teamUid', teamUid)

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value))
      }
    }
  }

  return `${basePath}?${searchParams.toString()}`
}

// 03）团队资料 GET 请求封装（getTeamProfileApi）
/**
 * 函数名：getTeamProfileApi
 * 功能：通过统一 axios 拦截器发送团队资料模块 GET 请求。
 * 输入：
 * - path：含查询串的相对路径
 * 输出：
 * - 返回值：业务 data
 * - 副作用：发起网络请求
 */
async function getTeamProfileApi<TData>(path: string): Promise<TData> {
  try {
    return await getApi<TData>(path)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new TeamProfileApiError(error.code, error.message)
    }
    throw error
  }
}

// 03.1）团队资料 PUT 请求封装（putTeamProfileApi）
/**
 * 函数名：putTeamProfileApi
 * 功能：通过统一 axios 拦截器发送团队资料模块 PUT 请求。
 * 输入：
 * - path：含查询串的相对路径
 * - payload：请求体
 * 输出：
 * - 返回值：业务 data
 * - 副作用：发起网络请求
 */
async function putTeamProfileApi<TPayload extends object, TData>(
  path: string,
  payload: TPayload,
): Promise<TData> {
  try {
    return await putApi<TPayload, TData>(path, payload)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new TeamProfileApiError(error.code, error.message)
    }
    throw error
  }
}

// 04）获取团队空间页壳（getTeamProfileSpace）
/**
 * 函数名：getTeamProfileSpace
 * 功能：获取团队 Hero、侧栏与成员预览数据。
 * 输入：
 * - teamUid：团队对外 uid
 * 输出：
 * - 返回值：TeamProfileSpaceData
 * - 副作用：发起网络请求
 */
export async function getTeamProfileSpace(teamUid: TeamResourceUid): Promise<TeamProfileSpaceData> {
  return getTeamProfileApi<TeamProfileSpaceData>(
    buildTeamProfileQueryPath(teamUid, '/team-profile/space'),
  )
}

// 05）获取团队主页 Tab 数据（getTeamProfileHome）
/**
 * 函数名：getTeamProfileHome
 * 功能：获取团队主页的项目/笔记/成果预览列表。
 * 输入：
 * - teamUid：团队对外 uid
 * - options：预览条数上限
 * 输出：
 * - 返回值：TeamProfileHomeData
 * - 副作用：发起网络请求
 */
export async function getTeamProfileHome(
  teamUid: TeamResourceUid,
  options?: {
    projectLimit?: number
    noteLimit?: number
    achievementLimit?: number
  },
): Promise<TeamProfileHomeData> {
  return getTeamProfileApi<TeamProfileHomeData>(
    buildTeamProfileQueryPath(teamUid, '/team-profile/home', {
      projectLimit: options?.projectLimit ?? TEAM_PROFILE_HOME_PROJECT_LIMIT,
      noteLimit: options?.noteLimit ?? TEAM_PROFILE_HOME_NOTE_LIMIT,
      achievementLimit: options?.achievementLimit ?? TEAM_PROFILE_HOME_ACHIEVEMENT_LIMIT,
    }),
  )
}

// 06）获取团队成员列表（getTeamProfileMembers）
/**
 * 函数名：getTeamProfileMembers
 * 功能：获取团队「成员」Tab 分页列表。
 * 输入：
 * - teamUid：团队对外 uid
 * - options：分页参数
 * 输出：
 * - 返回值：TeamProfileMembersData
 * - 副作用：发起网络请求
 */
export async function getTeamProfileMembers(
  teamUid: TeamResourceUid,
  options?: { page?: number; pageSize?: number },
): Promise<TeamProfileMembersData> {
  return getTeamProfileApi<TeamProfileMembersData>(
    buildTeamProfileQueryPath(teamUid, '/team-profile/members', {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 100,
    }),
  )
}

// 07）获取团队项目列表（getTeamProfileProjects）
/**
 * 函数名：getTeamProfileProjects
 * 功能：获取团队「项目」Tab 分页列表。
 * 输入：
 * - teamUid：团队对外 uid
 * - options：分页参数
 * 输出：
 * - 返回值：TeamProfileProjectsData
 * - 副作用：发起网络请求
 */
export async function getTeamProfileProjects(
  teamUid: TeamResourceUid,
  options?: { page?: number; pageSize?: number },
): Promise<TeamProfileProjectsData> {
  return getTeamProfileApi<TeamProfileProjectsData>(
    buildTeamProfileQueryPath(teamUid, '/team-profile/projects', {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 20,
    }),
  )
}

// 08）获取团队笔记列表（getTeamProfileNotes）
/**
 * 函数名：getTeamProfileNotes
 * 功能：获取团队「笔记」Tab 分页列表。
 * 输入：
 * - teamUid：团队对外 uid
 * - options：分页与内容类型筛选
 * 输出：
 * - 返回值：TeamProfileNotesData
 * - 副作用：发起网络请求
 */
export async function getTeamProfileNotes(
  teamUid: TeamResourceUid,
  options?: {
    page?: number
    pageSize?: number
    contentType?: '图文' | '视频'
  },
): Promise<TeamProfileNotesData> {
  return getTeamProfileApi<TeamProfileNotesData>(
    buildTeamProfileQueryPath(teamUid, '/team-profile/notes', {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 21,
      contentType: options?.contentType,
    }),
  )
}

// 09）获取团队成果列表（getTeamProfileAchievements）
/**
 * 函数名：getTeamProfileAchievements
 * 功能：获取团队「成果」Tab 分页列表。
 * 输入：
 * - teamUid：团队对外 uid
 * - options：分页参数
 * 输出：
 * - 返回值：TeamProfileAchievementsData
 * - 副作用：发起网络请求
 */
export async function getTeamProfileAchievements(
  teamUid: TeamResourceUid,
  options?: { page?: number; pageSize?: number },
): Promise<TeamProfileAchievementsData> {
  return getTeamProfileApi<TeamProfileAchievementsData>(
    buildTeamProfileQueryPath(teamUid, '/team-profile/achievements', {
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 20,
    }),
  )
}

// 10）批量更新团队成员（updateTeamProfileMembers）
/**
 * 函数名：updateTeamProfileMembers
 * 功能：批量同步团队成员（career / isAdmin / 增删成员）。
 * 输入：
 * - teamUid：团队对外 uid
 * - body：updates / additions / removals
 * 输出：
 * - 返回值：UpdateTeamProfileMembersResponse
 * - 副作用：发起网络请求
 */
export async function updateTeamProfileMembers(
  teamUid: TeamResourceUid,
  body: UpdateTeamProfileMembersRequest,
): Promise<UpdateTeamProfileMembersResponse> {
  return putTeamProfileApi<UpdateTeamProfileMembersRequest, UpdateTeamProfileMembersResponse>(
    buildTeamProfileQueryPath(teamUid, '/team-profile/members'),
    body,
  )
}

// 11）创建学生团队（createStudentTeam）
/**
 * 函数名：createStudentTeam
 * 功能：创建一个新的学生团队（team.type=STUDENT_TEAM），创建者自动成为负责人（role=LEADER）。
 * 输入：
 * - body：name（必填）、description（选填）
 * 输出：
 * - 返回值：CreateStudentTeamResponse（teamUid, name）
 * - 副作用：发起网络请求、创建 team 记录及 team_member 负责人行
 */
export async function createStudentTeam(
  body: CreateStudentTeamRequest,
): Promise<CreateStudentTeamResponse> {
  try {
    return await postApi<CreateStudentTeamRequest, CreateStudentTeamResponse>('/team/create', body)
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new TeamProfileApiError(error.code, error.message)
    }
    throw error
  }
}

export type {
  CreateStudentTeamRequest,
  CreateStudentTeamResponse,
  TeamProfileAchievementDto,
  TeamProfileAchievementsData,
  TeamProfileCoreProfileDto,
  TeamProfileExtendedProfileDto,
  TeamProfileHomeData,
  TeamProfileInfoRowDto,
  TeamProfileMemberDto,
  TeamProfileMembersData,
  TeamProfileNotesData,
  TeamProfileProjectsData,
  TeamProfileProjectDto,
  TeamProfileSpaceData,
  TeamMemberRole,
  TeamProfileMemberAdditionDto,
  TeamProfileMemberRemovalDto,
  TeamProfileMemberUpdateDto,
  UpdateTeamProfileMembersRequest,
  UpdateTeamProfileMembersResponse,
} from './types'
