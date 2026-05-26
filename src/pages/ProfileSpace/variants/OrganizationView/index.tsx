import './OrganizationView.css'
import { OrganizationView } from './OrganizationView'
import { useOrganizationViewPage } from './useOrganizationViewPage'

// 01）机构空间变体入口（OrganizationViewPage）
/**
 * 函数名：OrganizationViewPage
 * 功能：Organization 变体对外入口，挂载 Hook 并渲染 OrganizationView。
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
export function OrganizationViewPage() {
  const model = useOrganizationViewPage()

  return <OrganizationView model={model} />
}

export { OrganizationView } from './OrganizationView'
export { useOrganizationViewPage } from './useOrganizationViewPage'
export {
  buildOrganizationSpacePath,
  isOrganizationSpacePathname,
} from './organizationTabRouting'
export type { OrganizationViewModel } from './useOrganizationViewPage'
export type {
  OrganizationCoreProfile,
  OrganizationExtendedProfile,
  OrganizationInfoRow,
  OrganizationTab,
  OrganizationTeamItem,
} from './types'
