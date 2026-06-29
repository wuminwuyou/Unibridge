// 01）机构空间页极薄路由入口（OrganizationProfilePage）
import { ProfileSpaceWidget } from '@widgets/profile-space'

/**
 * 函数名：OrganizationProfilePage
 * 功能：/org/:entityCode 与 /org/:entityCode/:orgTab 路由入口；仅挂载机构空间大部件。
 * 输入：无（entityCode 由 widgets/profile-space 通过 react-router useParams 内部读取）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
function OrganizationProfilePage() {
  return <ProfileSpaceWidget variant="organization" />
}

export default OrganizationProfilePage
