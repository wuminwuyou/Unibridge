// 01）项目旧路由兼容入口（/project-detail）
// 有 query → 301 到 /projects/:id
// 无 query → 渲染详情页（读取 sessionStorage/route state，同旧版刷新预览）
import { Navigate, useSearchParams } from 'react-router-dom'
import { buildProjectDetailPath } from '@shared/lib/projectRoutes'
import ProjectDetailWidget from '@widgets/project-detail'

// 02）解析旧详情 query 并决定跳转目标（resolveLegacyProjectDetailTarget）
function resolveLegacyProjectDetailTarget(searchParams: URLSearchParams): string | null {
  const uid = searchParams.get('uid')
  const id = searchParams.get('id')
  const title = searchParams.get('title')

  if (uid) {
    return buildProjectDetailPath(uid)
  }
  if (id) {
    return buildProjectDetailPath(id)
  }
  if (title) {
    return buildProjectDetailPath(encodeURIComponent(title))
  }

  return null
}

// 03）旧 /project-detail 入口（LegacyProjectDetailEntry）
export function LegacyProjectDetailEntry() {
  const [searchParams] = useSearchParams()
  const target = resolveLegacyProjectDetailTarget(searchParams)

  if (target) {
    return <Navigate to={target} replace />
  }

  // 无 query：保留原地，由 Widget 读取 sessionStorage 回退
  return <ProjectDetailWidget />
}
