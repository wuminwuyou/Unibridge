// 01）顶栏发布入口导航状态（PublishEntryFreshLocationState）
/** 从 TopNavbar「发布」菜单进入发布页时携带，用于 remount 表单并清空 session 缓存 */
export interface PublishEntryFreshLocationState {
  publishEntryFresh: true
  publishEntryInstanceKey: string
}

// 02）创建顶栏发布入口导航 state（createPublishEntryFreshLocationState）
/**
 * 函数名：createPublishEntryFreshLocationState
 * 功能：生成带唯一实例 key 的顶栏发布入口路由 state，供发布页 remount 空表单。
 * 输入：无
 * 输出：
 * - 返回值：PublishEntryFreshLocationState
 * - 副作用：无
 */
export function createPublishEntryFreshLocationState(): PublishEntryFreshLocationState {
  return {
    publishEntryFresh: true,
    publishEntryInstanceKey: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  }
}

// 03）判断是否为顶栏发布入口导航（isPublishEntryFreshNavigation）
/**
 * 函数名：isPublishEntryFreshNavigation
 * 功能：判断路由 state 是否标记为从顶栏「发布」菜单进入，需 remount 发布表单。
 * 输入：
 * - state：location.state
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function isPublishEntryFreshNavigation(state: unknown): boolean {
  if (!state || typeof state !== 'object') {
    return false
  }

  return (state as PublishEntryFreshLocationState).publishEntryFresh === true
}

// 04）读取顶栏发布入口实例 key（readPublishEntryInstanceKey）
/**
 * 函数名：readPublishEntryInstanceKey
 * 功能：从顶栏发布入口路由 state 中读取表单 remount 用的实例 key。
 * 输入：
 * - state：location.state
 * 输出：
 * - 返回值：实例 key 字符串；非顶栏发布入口时为 null
 * - 副作用：无
 */
export function readPublishEntryInstanceKey(state: unknown): string | null {
  if (!isPublishEntryFreshNavigation(state)) {
    return null
  }

  const instanceKey = (state as PublishEntryFreshLocationState).publishEntryInstanceKey
  return typeof instanceKey === 'string' && instanceKey.length > 0 ? instanceKey : null
}
