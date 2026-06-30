// 01）路由参数解析 — 适配 RESTful /projects/:id
import { isProjectResourceUid } from '@shared/api/resourceUid'
import type { ProjectResourceUid } from '@shared/api/resourceUid'

// 02）解析结果（ParsedProjectDetailRouteParam）
export interface ParsedProjectDetailRouteParam {
  /** 有效 project uid 时返回，否则 null */
  projectUid: ProjectResourceUid | null
  /** uid 无效时返回 title 回退值（decodeURIComponent），否则 null */
  titleFallback: string | null
}

// 03）解析项目详情路由参数（parseProjectDetailRouteParam）
/**
 * 函数名：parseProjectDetailRouteParam
 * 功能：解析 /projects/:id 中的 id，判断走 API 还是 title 回退。
 * 输入：
 * - rawId：useParams().id（原始路由参数）
 * 输出：
 * - 返回值：ParsedProjectDetailRouteParam
 */
export function parseProjectDetailRouteParam(rawId: string | undefined): ParsedProjectDetailRouteParam {
  if (!rawId) {
    return { projectUid: null, titleFallback: null }
  }

  // 兼容旧 ?uid= / ?id= 格式：直接传递到 isProjectResourceUid
  if (isProjectResourceUid(rawId)) {
    return { projectUid: rawId, titleFallback: null }
  }

  // uid 格式不匹配 → 按 title 回退
  return { projectUid: null, titleFallback: decodeURIComponent(rawId) }
}
