import { HttpApiError, getApi, postApi, putApi } from '../http'
import type { ProjectResourceUid } from '../resourceUid'
import type { ProjectDetailDto, UpsertProjectRequest, UpsertProjectResponse } from './types'

// 01）项目接口异常类型（ProjectsApiError）
export class ProjectsApiError extends HttpApiError { }

// 02）项目请求封装（wrapProjectsApi）
async function wrapProjectsApi<TData>(request: () => Promise<TData>): Promise<TData> {
  try {
    return await request()
  } catch (error) {
    if (error instanceof HttpApiError) {
      throw new ProjectsApiError(error.code, error.message)
    }
    throw error
  }
}

// 03）创建项目（createProject）
/**
 * 函数名：createProject
 * 功能：调用 POST /projects 创建项目（草稿或发布）。
 */
export async function createProject(payload: UpsertProjectRequest): Promise<UpsertProjectResponse> {
  return wrapProjectsApi(() => postApi<UpsertProjectRequest, UpsertProjectResponse>('/projects', payload))
}

// 04）更新项目（updateProject）
/**
 * 函数名：updateProject
 * 功能：调用 PUT /projects/{uid} 更新项目。
 */
export async function updateProject(
  projectUid: ProjectResourceUid,
  payload: UpsertProjectRequest,
): Promise<UpsertProjectResponse> {
  return wrapProjectsApi(() => putApi<UpsertProjectRequest, UpsertProjectResponse>(`/projects/${projectUid}`, payload))
}

// 05）查询项目详情（getProjectDetail）
/**
 * 函数名：getProjectDetail
 * 功能：调用 GET /projects/{uid} 获取项目详情。
 */
export async function getProjectDetail(projectUid: ProjectResourceUid): Promise<ProjectDetailDto> {
  return wrapProjectsApi(() => getApi<ProjectDetailDto>(`/projects/${projectUid}`))
}

export { buildUpsertProjectRequest } from './types'
export type {
  ProjectDetailDto,
  ProjectPublishAction,
  UpsertProjectRequest,
  UpsertProjectResponse,
} from './types'
