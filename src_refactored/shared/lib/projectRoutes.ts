// 01）项目相关前端路由（projectRoutes）
import { isProjectResourceUid } from '@shared/api/resourceUid'

/** 商业项目大厅 */
export const PROJECTS_COMMERCIAL_PATH = '/projects'

/** 校园招募大厅 */
export const PROJECTS_CAMPUS_PATH = '/projects/campus'

/** 发布 / 创建项目 */
export const PROJECTS_CREATE_PATH = '/projects/create'

/** 项目详情（RESTful） */
export function buildProjectDetailPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`
}

/** 项目卡片跳转链接 */
export interface ProjectDetailRouteInput {
  uid?: string | null
  title: string
}

export function resolveProjectDetailHref(project: ProjectDetailRouteInput): string {
  if (isProjectResourceUid(project.uid)) {
    return buildProjectDetailPath(project.uid)
  }
  return buildProjectDetailPath(project.title)
}
