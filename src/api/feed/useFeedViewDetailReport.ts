import { useEffect, useRef } from 'react'
import type { NoteResourceUid, ProjectResourceUid } from '../resourceUid'
import { reportFeedViewDetail } from './reportFeedViewDetail'
import type { FeedInteractionTargetType } from './types'

// 01）详情页浏览埋点 Hook 参数（UseFeedViewDetailReportParams）
interface UseFeedViewDetailReportParams {
  enabled: boolean
  targetType: FeedInteractionTargetType
  targetUid: ProjectResourceUid | NoteResourceUid | null
  tags: string[]
}

// 02）详情页浏览埋点 Hook（useFeedViewDetailReport）
/**
 * 函数名：useFeedViewDetailReport
 * 功能：详情页加载成功后上报 VIEW_DETAIL 埋点，同一 uid 仅上报一次。
 * 实现方法：
 * - enabled 为 true 且 targetUid 有效时触发
 * - 使用 ref 记录已上报 uid，避免 StrictMode 重复上报
 * 输入：
 * - enabled：是否允许上报（如 API 加载完成）
 * - targetType：NOTE | PROJECT
 * - targetUid：目标 uid
 * - tags：标签快照
 * 输出：
 * - 返回值：void
 * - 副作用：可能发起埋点请求
 */
export function useFeedViewDetailReport({
  enabled,
  targetType,
  targetUid,
  tags,
}: UseFeedViewDetailReportParams): void {
  const reportedUidRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !targetUid) {
      return
    }

    if (reportedUidRef.current === targetUid) {
      return
    }

    reportedUidRef.current = targetUid
    reportFeedViewDetail(targetType, targetUid, tags)
  }, [enabled, tags, targetType, targetUid])
}
