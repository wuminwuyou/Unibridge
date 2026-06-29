// 01）个人空间页极薄路由入口（PersonalProfilePage）
import { ProfileSpaceWidget } from '@widgets/profile-space'

/**
 * 函数名：PersonalProfilePage
 * 功能：/profile 与 /profile/:profileTab 路由入口；仅挂载个人空间大部件。
 * 输入：无（变体身份信息由 widgets/profile-space 内部按路由解析）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
function PersonalProfilePage() {
  return <ProfileSpaceWidget variant="personal" />
}

export default PersonalProfilePage
