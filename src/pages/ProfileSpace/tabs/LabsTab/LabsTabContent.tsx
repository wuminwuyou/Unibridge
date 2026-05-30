import type { ProfileTeamPreviewItem } from '../../components/types'
import { ProfileTeamsSection } from '../../components/ProfileTeamsSection'

// 01）实验室 Tab 内容 Props（LabsTabContentProps）
export interface LabsTabContentProps {
  title?: string
  teams: ProfileTeamPreviewItem[]
  emptyLabel?: string
  /** 是否显示「管理实验室」入口按钮 */
  showManageLabs?: boolean
  /** 「管理实验室」按钮点击回调 */
  onManageLabs?: () => void
}

// 02）实验室 Tab 内容（LabsTabContent）
/**
 * 函数名：LabsTabContent
 * 功能：渲染机构空间「实验室」Tab 完整列表，可切换管理表单。
 * 输入：
 * - title：区块标题
 * - teams：下属实验室列表
 * - emptyLabel：空态文案
 * - showManageLabs：是否显示管理按钮
 * - onManageLabs：点击管理按钮回调
 * 输出：
 * - 返回值：React 节点
 * - 副作用：无
 */
export function LabsTabContent({
  title = '下属实验室',
  teams,
  emptyLabel = '暂无下属实验室',
  showManageLabs = false,
  onManageLabs,
}: LabsTabContentProps) {
  const headerAction = showManageLabs && onManageLabs ? (
    <button type="button" className="profile-tab-section__action" onClick={onManageLabs}>
      管理实验室
    </button>
  ) : undefined

  return (
    <ProfileTeamsSection
      title={title}
      teams={teams}
      mode="full"
      emptyLabel={emptyLabel}
      headerAction={headerAction}
    />
  )
}
