import { getAccessToken } from '../../auth/tokenStorage'
import type { NoteResourceUid, ProjectResourceUid } from '../resourceUid'
import { postFeedEvent } from './index'
import type { FeedInteractionTargetType } from './types'

// 01）上报 Feed 详情浏览埋点（reportFeedViewDetail）
/**
 * 函数名：reportFeedViewDetail
 * 功能：登录用户进入笔记/项目详情时 fire-and-forget 上报 VIEW_DETAIL 埋点。
 * 实现方法：
 * - 未登录时直接返回
 * - 调用 POST /feed/events，失败时静默忽略
 * 输入：
 * - targetType：NOTE | PROJECT
 * - targetUid：目标资源 uid
 * - tags：标签快照数组
 * 输出：
 * - 返回值：void（Promise）
 * - 副作用：可能发起网络请求
 */
export function reportFeedViewDetail(
  targetType: FeedInteractionTargetType,
  targetUid: ProjectResourceUid | NoteResourceUid,
  tags: string[],
): void {
  if (!getAccessToken()) {
    return
  }

  void postFeedEvent({
    eventType: 'VIEW_DETAIL',
    targetType,
    targetUid,
    tags,
  }).catch(() => {
    // 埋点失败不阻塞详情页阅读体验
  })
}
