// 01）实验室 Tab 内容（LabsTabContent）
import type { ProfileTeamPreviewItem } from '@entities/team/ui/OrganizationTeamCard/OrganizationTeamCard'
import { ProfileTeamsSection } from '../sections/ProfileTeamsSection'

// 02）实验室 Tab 内容 Props（LabsTabContentProps）
export interface LabsTabContentProps {
  title?: string
  teams: ProfileTeamPreviewItem[]
  emptyLabel?: string
  showManageLabs?: boolean
  onManageLabs?: () => void
}

// 03）实验室 Tab 内容（LabsTabContent）
/**
 * 函数名：LabsTabContent
 * 功能：渲染机构空间「实验室」Tab 完整列表，可切换管理表单。
 * 输入：
 * - title / teams / emptyLabel / showManageLabs / onManageLabs
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
