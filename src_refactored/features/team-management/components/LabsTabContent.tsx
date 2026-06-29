// 01）机构实验室 Tab 管理入口（LabsTabContent）
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import type { TeamResourceUid } from '@shared/api/resourceUid'
import type { ProfileTabLoadState } from '@shared/types/loadState'
import { OrgTeamsList } from '@entities/team/ui/OrgTeamsList'
import type { ProfileTeamPreviewItem } from '@entities/team/ui/OrganizationTeamCard/OrganizationTeamCard'
import { buildTeamSpacePath } from '@features/profile-space/lib/routing/teamTabRouting'

// 02）实验室 Tab 内容 Props（LabsTabContentProps）
export interface LabsTabContentProps {
  title?: string
  teams: ProfileTeamPreviewItem[]
  emptyLabel?: string
  showManageLabs?: boolean
  onManageLabs?: () => void
  loadState?: ProfileTabLoadState
  errorMessage?: string | null
}

// 03）机构实验室 Tab 内容（LabsTabContent）
/**
 * 函数名：LabsTabContent
 * 功能：渲染机构空间「实验室」Tab 完整列表，可切换到「管理实验室」表单。
 * 实现方法：
 * - 复用 entities/team/ui/OrgTeamsList 作为纯展示骨架
 * - 通过 buildTeamSpacePath 注入跳转路径
 * - 通过 headerAction 注入「管理实验室」按钮（动词，归属 features）
 * 输入：
 * - title / teams / emptyLabel / showManageLabs / onManageLabs / loadState / errorMessage
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
  loadState,
  errorMessage,
}: LabsTabContentProps) {
  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载实验室列表…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载实验室列表失败，请稍后重试'}
      </p>
    )
  }

  const headerAction = showManageLabs && onManageLabs ? (
    <button type="button" className="profile-tab-section__action" onClick={onManageLabs}>
      管理实验室
    </button>
  ) : undefined

  return (
    <OrgTeamsList
      title={title}
      teams={teams}
      mode="full"
      emptyLabel={emptyLabel}
      resolveTeamSpacePath={(teamUid: TeamResourceUid) => buildTeamSpacePath(teamUid)}
      headerAction={headerAction}
    />
  )
}
