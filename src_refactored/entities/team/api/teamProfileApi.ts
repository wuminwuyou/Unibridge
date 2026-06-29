import { HttpApiError, getApi, putApi, postApi } from '../../../shared/api/http'
import type { TeamResourceUid } from '../../../shared/api/resourceUid'
import type {
  TeamProfileSpaceData, TeamProfileHomeData, TeamProfileMembersData,
  TeamProfileProjectsData, TeamProfileNotesData, TeamProfileAchievementsData,
  UpdateTeamProfileMembersRequest, UpdateTeamProfileMembersResponse,
  CreateStudentTeamRequest, CreateStudentTeamResponse,
} from '../model/types'

// 01）团队资料接口异常类型（TeamProfileApiError）
export class TeamProfileApiError extends HttpApiError {}

// 02）拼接团队资料查询路径（buildTeamProfileQueryPath）
function buildTeamProfileQueryPath(
  teamUid: TeamResourceUid,
  basePath: string,
  extraParams?: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams()
  searchParams.set('teamUid', teamUid)
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== undefined && value !== null && value !== '') searchParams.set(key, String(value))
    }
  }
  return `${basePath}?${searchParams.toString()}`
}

// 03）团队资料 GET 请求封装（getTeamProfileApi）
async function getTeamProfileApi<TData>(path: string): Promise<TData> {
  try { return await getApi<TData>(path) }
  catch (error) {
    if (error instanceof HttpApiError) throw new TeamProfileApiError(error.code, error.message)
    throw error
  }
}

// 04）获取团队空间页壳（getTeamProfileSpace）
export async function getTeamProfileSpace(teamUid: TeamResourceUid): Promise<TeamProfileSpaceData> {
  return getTeamProfileApi<TeamProfileSpaceData>(buildTeamProfileQueryPath(teamUid, '/team-profile/space'))
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
      projectLimit: options?.projectLimit,
      noteLimit: options?.noteLimit,
      achievementLimit: options?.achievementLimit,
    }),
  )
}

// 06）获取团队成员列表（getTeamProfileMembers）
export async function getTeamProfileMembers(teamUid: TeamResourceUid, options?: { page?: number; pageSize?: number }): Promise<TeamProfileMembersData> {
  return getTeamProfileApi<TeamProfileMembersData>(buildTeamProfileQueryPath(teamUid, '/team-profile/members', { page: options?.page ?? 1, pageSize: options?.pageSize ?? 100 }))
}

// 07）获取团队项目列表（getTeamProfileProjects）
export async function getTeamProfileProjects(teamUid: TeamResourceUid, options?: { page?: number; pageSize?: number }): Promise<TeamProfileProjectsData> {
  return getTeamProfileApi<TeamProfileProjectsData>(buildTeamProfileQueryPath(teamUid, '/team-profile/projects', { page: options?.page ?? 1, pageSize: options?.pageSize ?? 20 }))
}

// 08）获取团队笔记列表（getTeamProfileNotes）
export async function getTeamProfileNotes(teamUid: TeamResourceUid, options?: { page?: number; pageSize?: number; contentType?: '图文' | '视频' }): Promise<TeamProfileNotesData> {
  return getTeamProfileApi<TeamProfileNotesData>(buildTeamProfileQueryPath(teamUid, '/team-profile/notes', { page: options?.page ?? 1, pageSize: options?.pageSize ?? 21, contentType: options?.contentType }))
}

// 09）获取团队成果列表（getTeamProfileAchievements）
export async function getTeamProfileAchievements(teamUid: TeamResourceUid, options?: { page?: number; pageSize?: number }): Promise<TeamProfileAchievementsData> {
  return getTeamProfileApi<TeamProfileAchievementsData>(buildTeamProfileQueryPath(teamUid, '/team-profile/achievements', { page: options?.page ?? 1, pageSize: options?.pageSize ?? 20 }))
}

// 10）批量更新团队成员（updateTeamProfileMembers）
export async function updateTeamProfileMembers(teamUid: TeamResourceUid, body: UpdateTeamProfileMembersRequest): Promise<UpdateTeamProfileMembersResponse> {
  try {
    return await putApi<UpdateTeamProfileMembersRequest, UpdateTeamProfileMembersResponse>(buildTeamProfileQueryPath(teamUid, '/team-profile/members'), body)
  } catch (error) {
    if (error instanceof HttpApiError) throw new TeamProfileApiError(error.code, error.message)
    throw error
  }
}

// 11）创建学生团队（createStudentTeam）
export async function createStudentTeam(body: CreateStudentTeamRequest): Promise<CreateStudentTeamResponse> {
  try {
    return await postApi<CreateStudentTeamRequest, CreateStudentTeamResponse>('/team/create', body)
  } catch (error) {
    if (error instanceof HttpApiError) throw new TeamProfileApiError(error.code, error.message)
    throw error
  }
}
