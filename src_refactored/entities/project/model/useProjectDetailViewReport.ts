// 01）项目详情浏览埋点 Hook（useProjectDetailViewReport）
// 使用 entities/project/api/projectFeedApi.recordView → POST /feed/view
import { useEffect, useRef } from 'react'
import type { ProjectResourceUid } from '@shared/api/resourceUid'
import { recordView } from '../api/projectFeedApi'
import { getAccessToken } from '@shared/lib/tokenStorage'

// 02）埋点 Hook
/**
 * 函数名：useProjectDetailViewReport
 * 功能：项目详情加载成功后上报 VIEW_DETAIL 埋点，同一 uid 仅上报一次。
 * 实现方法：
 * - 登录用户 + uid 有效 + enabled 为 true 时触发
 * - ref 记录已上报 uid，避免 StrictMode 重复
 * - fire-and-forget 失败静默忽略
 * 输入：
 * - enabled：API 加载成功等条件
 * - projectUid：目标项目 uid
 * - tags：标签快照（skillTags）
 * 输出：
 * - 返回值：void
 * - 副作用：可能发起 POST /feed/view
 */
export function useProjectDetailViewReport({
  enabled,
  projectUid,
  tags,
}: {
  enabled: boolean
  projectUid: ProjectResourceUid | null
  tags: string[]
}): void {
  const reportedUidRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !projectUid) {
      return
    }

    if (!getAccessToken()) {
      return
    }

    if (reportedUidRef.current === projectUid) {
      return
    }

    reportedUidRef.current = projectUid
    void recordView({ targetType: 'PROJECT', targetUid: projectUid }).catch(() => {
      // 埋点失败不阻塞详情页阅读体验
    })
  }, [enabled, projectUid, tags])
}
