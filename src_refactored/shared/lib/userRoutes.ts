import { isUserResourceUid, type UserResourceUid } from '../api/resourceUid'

// 01）个人空间 Tab 类型（ProfileTab）
export type ProfileTab = '主页' | '项目' | '笔记' | '收藏' | '设置'

// 02）Tab 对应 URL 路径段（profileTabRouteSegmentByTab）
const profileTabRouteSegmentByTab: Record<ProfileTab, string | null> = {
  主页: null,
  项目: 'project',
  笔记: 'note',
  收藏: 'favorite',
  设置: 'settings',
}

// 03）构建个人空间路径（buildPersonalSpacePath）
/**
 * 函数名：buildPersonalSpacePath
 * 功能：构建个人空间路径；查看他人空间时在查询串携带 uid。
 * 输入：
 * - profileUid：目标用户 uid，缺省时为当前登录用户空间
 * - tab：ProfileTab，默认主页
 * 输出：
 * - 返回值：路径字符串（含可选 ?uid=）
 * - 副作用：无
 */
export function buildPersonalSpacePath(
  profileUid?: UserResourceUid | null,
  tab: ProfileTab = '主页',
): string {
  const segment = profileTabRouteSegmentByTab[tab]
  const basePath = segment ? `/profile/${segment}` : '/profile'

  if (!profileUid || !isUserResourceUid(profileUid)) {
    return basePath
  }

  const searchParams = new URLSearchParams()
  searchParams.set('uid', profileUid)
  return `${basePath}?${searchParams.toString()}`
}
