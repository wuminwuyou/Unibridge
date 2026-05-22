import { supportedProfileTabs } from './profileSpacePageData'
import type { ProfileTab } from './types'

// 01）从 URL 解析个人空间 Tab（resolveProfileTabFromSearch）
/**
 * 函数名：resolveProfileTabFromSearch
 * 功能：从 URL 查询参数中解析个人空间 Tab，支持从外部入口直达具体页面。
 * 实现方法：
 * - 使用 URLSearchParams 读取 tab 参数
 * - 判断 tab 是否属于受支持的 Tab 列表
 * - 不合法时回退到默认「主页」
 * 输入：
 * - search：location.search 查询字符串
 * 输出：
 * - 返回值：ProfileTab
 * - 副作用：无
 */
export function resolveProfileTabFromSearch(search: string): ProfileTab {
  const searchParams = new URLSearchParams(search)
  const tab = searchParams.get('tab')

  if (tab && supportedProfileTabs.has(tab as ProfileTab)) {
    return tab as ProfileTab
  }

  return '主页'
}
