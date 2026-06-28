import { HttpApiError, getApi, postApi, putApi, deleteApi } from '../../../shared/api/http'
import type { EntityCode } from '../../../shared/api/resourceUid'
import type {
  EntityProfileSpaceData, EntityProfileHomeData, EntityProfileTeamsData,
  EntityProfileProjectsData, EntityProfileNotesData, EntityProfileMembersData,
  EntityProfileMenuData, CreateEntityTeamRequest, CreateEntityTeamResponse,
  UpdateEntityTeamRequest, AddEntityMemberRequest, AddEntityMemberResponse,
  RemoveEntityMemberRequest,
} from '../model/types'

// 01）机构资料接口异常类型（EntityProfileApiError）
export class EntityProfileApiError extends HttpApiError {}

// 02）拼接机构资料查询路径（buildEntityProfileQueryPath）
function buildEntityProfileQueryPath(
  entityCode: EntityCode, basePath: string,
  extraParams?: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams()
  searchParams.set('entityCode', entityCode)
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== undefined && value !== null && value !== '' && value !== 0) searchParams.set(key, String(value))
    }
  }
  return `${basePath}?${searchParams.toString()}`
}

// 03）机构资料 GET 请求封装
async function getEntityProfileApi<TData>(path: string): Promise<TData> {
  try { return await getApi<TData>(path) }
  catch (error) { if (error instanceof HttpApiError) throw new EntityProfileApiError(error.code, error.message); throw error }
}

// 04）获取机构空间页壳（getEntityProfileSpace）
export async function getEntityProfileSpace(entityCode: EntityCode): Promise<EntityProfileSpaceData> {
  return getEntityProfileApi<EntityProfileSpaceData>(buildEntityProfileQueryPath(entityCode, '/entity-profile/space'))
}

// 05）获取机构主页 Tab 数据（getEntityProfileHome）
export async function getEntityProfileHome(entityCode: EntityCode): Promise<EntityProfileHomeData> {
  return getEntityProfileApi<EntityProfileHomeData>(buildEntityProfileQueryPath(entityCode, '/entity-profile/home'))
}

// 06）获取机构实验室列表（getEntityProfileTeams）
export async function getEntityProfileTeams(entityCode: EntityCode, options?: { page?: number; pageSize?: number }): Promise<EntityProfileTeamsData> {
  return getEntityProfileApi<EntityProfileTeamsData>(buildEntityProfileQueryPath(entityCode, '/entity-profile/teams', { page: options?.page ?? 1, pageSize: options?.pageSize ?? 20 }))
}

// 07）获取机构人员列表（getEntityProfileMembers）
export async function getEntityProfileMembers(entityCode: EntityCode, options?: { page?: number; pageSize?: number }): Promise<EntityProfileMembersData> {
  return getEntityProfileApi<EntityProfileMembersData>(buildEntityProfileQueryPath(entityCode, '/entity-profile/members', { page: options?.page ?? 1, pageSize: options?.pageSize ?? 20 }))
}

// 08）获取机构项目列表（getEntityProfileProjects）
export async function getEntityProfileProjects(entityCode: EntityCode, options?: { page?: number; pageSize?: number }): Promise<EntityProfileProjectsData> {
  return getEntityProfileApi<EntityProfileProjectsData>(buildEntityProfileQueryPath(entityCode, '/entity-profile/projects', { page: options?.page ?? 1, pageSize: options?.pageSize ?? 20 }))
}

// 09）获取机构笔记列表（getEntityProfileNotes）
export async function getEntityProfileNotes(entityCode: EntityCode, options?: { page?: number; pageSize?: number; contentType?: '图文' | '视频' }): Promise<EntityProfileNotesData> {
  return getEntityProfileApi<EntityProfileNotesData>(buildEntityProfileQueryPath(entityCode, '/entity-profile/notes', { page: options?.page ?? 1, pageSize: options?.pageSize ?? 21, contentType: options?.contentType }))
}

// 10）获取机构顶部用户菜单（getEntityProfileMenu）
export async function getEntityProfileMenu(entityCode: EntityCode): Promise<EntityProfileMenuData> {
  return getEntityProfileApi<EntityProfileMenuData>(buildEntityProfileQueryPath(entityCode, '/entity-profile/menu'))
}

// 11）创建机构下属团队（createEntityTeam）
export async function createEntityTeam(body: CreateEntityTeamRequest): Promise<CreateEntityTeamResponse> {
  try { return await postApi<CreateEntityTeamRequest, CreateEntityTeamResponse>('/entity-profile/team', body) }
  catch (error) { if (error instanceof HttpApiError) throw new EntityProfileApiError(error.code, error.message); throw error }
}

// 12）更新机构下属团队（updateEntityTeam）
export async function updateEntityTeam(teamUid: string, body: UpdateEntityTeamRequest): Promise<void> {
  try { await putApi<UpdateEntityTeamRequest, void>(`/entity-profile/team?teamUid=${encodeURIComponent(teamUid)}`, body) }
  catch (error) { if (error instanceof HttpApiError) throw new EntityProfileApiError(error.code, error.message); throw error }
}

// 13）删除机构下属团队（deleteEntityTeam）
export async function deleteEntityTeam(teamUid: string): Promise<void> {
  try { await deleteApi<void>(`/entity-profile/team?teamUid=${encodeURIComponent(teamUid)}`) }
  catch (error) { if (error instanceof HttpApiError) throw new EntityProfileApiError(error.code, error.message); throw error }
}

// 14）添加机构关联人员（addEntityProfileMember）
export async function addEntityProfileMember(body: AddEntityMemberRequest): Promise<AddEntityMemberResponse> {
  try { return await postApi<AddEntityMemberRequest, AddEntityMemberResponse>('/entity-profile/member', body) }
  catch (error) { if (error instanceof HttpApiError) throw new EntityProfileApiError(error.code, error.message); throw error }
}

// 15）移除机构关联人员（removeEntityProfileMember）
export async function removeEntityProfileMember(body: RemoveEntityMemberRequest): Promise<void> {
  try { await deleteApi<void>(`/entity-profile/member?entityCode=${encodeURIComponent(body.entityCode)}&uid=${encodeURIComponent(body.uid)}`) }
  catch (error) { if (error instanceof HttpApiError) throw new EntityProfileApiError(error.code, error.message); throw error }
}
