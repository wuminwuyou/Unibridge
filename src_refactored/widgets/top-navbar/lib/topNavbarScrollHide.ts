// 01）TopNavbar 滚动隐藏路径判定（topNavbarScrollHide）
import { matchPath } from 'react-router-dom'

// 02）滚动隐藏白名单路径（SCROLL_HIDE_ENABLED_PATHS）
export const SCROLL_HIDE_ENABLED_PATHS = ['/notes/editor', '/notes/:id'] as const

const SCROLL_HIDE_RESERVED_NOTE_SEGMENTS = new Set(['editor', 'create'])

// 03）滚动隐藏阈值（SCROLL_HIDE_MIN_DELTA / SCROLL_HIDE_ACTIVATE_OFFSET）
export const SCROLL_HIDE_MIN_DELTA = 6
export const SCROLL_HIDE_ACTIVATE_OFFSET = 72

/**
 * 函数名：isTopNavbarScrollHideEnabled
 * 功能：判断当前 pathname 是否应启用 TopNavbar 滚动隐藏。
 * 实现方法：
 * - 精确匹配 /notes/editor
 * - 匹配 /notes/:id 并排除 editor/create 保留段
 * 输入：
 * - pathname：当前路由 pathname
 * 输出：
 * - 返回值：boolean
 * - 副作用：无
 */
export function isTopNavbarScrollHideEnabled(pathname: string): boolean {
  if (matchPath({ path: SCROLL_HIDE_ENABLED_PATHS[0], end: true }, pathname)) {
    return true
  }

  const noteMatch = matchPath({ path: SCROLL_HIDE_ENABLED_PATHS[1], end: true }, pathname)
  const noteId = noteMatch?.params.id
  if (!noteId || SCROLL_HIDE_RESERVED_NOTE_SEGMENTS.has(noteId)) {
    return false
  }

  return true
}
