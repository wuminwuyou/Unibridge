import { HttpApiError, getApi, postApi, putApi } from '../../../shared/api/http'
import type { ProjectResourceUid } from '../../../shared/api/resourceUid'
import type { ProjectDetailDto, UpsertProjectRequest, UpsertProjectResponse } from '../model/types'

// 01）项目接口异常类型（ProjectsApiError）
export class ProjectsApiError extends HttpApiError {}

// 02）项目请求封装（wrapProjectsApi）
async function wrapProjectsApi<TData>(request: () => Promise<TData>): Promise<TData> {
  try { return await request() }
  catch (error) {
    if (error instanceof HttpApiError) throw new ProjectsApiError(error.code, error.message)
    throw error
  }
}

// 03）创建项目（createProject）
export async function createProject(payload: UpsertProjectRequest): Promise<UpsertProjectResponse> {
  return wrapProjectsApi(() => postApi<UpsertProjectRequest, UpsertProjectResponse>('/projects', payload))
}

// 04）更新项目（updateProject）
export async function updateProject(
  projectUid: ProjectResourceUid,
  payload: UpsertProjectRequest,
): Promise<UpsertProjectResponse> {
  return wrapProjectsApi(() => putApi<UpsertProjectRequest, UpsertProjectResponse>(`/projects/${projectUid}`, payload))
}

// 05）查询项目详情（getProjectDetail）
export async function getProjectDetail(projectUid: ProjectResourceUid): Promise<ProjectDetailDto> {
  return wrapProjectsApi(() => getApi<ProjectDetailDto>(`/projects/${projectUid}`))
}
