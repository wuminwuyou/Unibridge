// 01）团队空间页极薄路由入口（TeamProfilePage）
import { ProfileSpaceWidget } from '@widgets/profile-space'

/**
 * 函数名：TeamProfilePage
 * 功能：/team/:teamUid 与 /team/:teamUid/:teamTab 路由入口；仅挂载团队空间大部件。
 * 输入：无（teamUid 由 widgets/profile-space 通过 react-router useParams 内部读取）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
function TeamProfilePage() {
  return <ProfileSpaceWidget variant="team" />
}

export default TeamProfilePage
