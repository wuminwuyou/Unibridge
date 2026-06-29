// 01）机构空间大部件（OrganizationSpaceWidget）— 负责拼装机构空间页骨架
import './OrganizationView.css'
import { useState } from 'react'
import { Building2, FilePenLine, MapPin, Users } from 'lucide-react'
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import { useAuth } from '@shared/hooks/useAuth'
import { isOrganizationAdminRole } from '@shared/lib/organizationSession'
import { ManageLabsForm, OrgMembersManageForm } from '@features/team-management'
import { ProfileSpaceShell } from './ProfileSpaceShell'
import { ProfileSpaceTabs } from './ProfileSpaceTabs'
import { ProfileSpaceShellStatus } from './ProfileSpaceStatus'
import { useOrganizationSpaceWidget, type OrganizationSpaceWidgetModel } from '../hooks/useOrganizationSpaceWidget'

// 02）Hero 内容（OrganizationSpaceHero）
function OrganizationSpaceHero({ model }: { model: OrganizationSpaceWidgetModel }) {
  const { shellLoadState, shellErrorMessage, isShellReady, orgCoreProfile, heroLogoUrl } = model

  if (shellLoadState === 'loading') {
    return <ProfileSpaceShellStatus loadState="loading" loadingLabel="正在加载机构空间…" />
  }
  if (shellLoadState === 'error') {
    return (
      <ProfileSpaceShellStatus
        loadState="error"
        errorMessage={shellErrorMessage ?? '加载机构空间失败，请稍后重试'}
        loadingLabel=""
      />
    )
  }
  if (!isShellReady || !orgCoreProfile) return null

  return (
    <>
      <div className="organization-view-hero">
        <img
          className="organization-view-hero__logo"
          aria-hidden="true"
          src={heroLogoUrl}
          alt={`${orgCoreProfile.name} Logo`}
        />
        <div className="organization-view-hero__meta">
          <div className="organization-view-hero__name-row">
            <h1>{orgCoreProfile.name}</h1>
            <span className="organization-view-hero__type-badge">{orgCoreProfile.typeLabel}</span>
          </div>
          {orgCoreProfile.intro ? (
            <p className="organization-view-hero__description">{orgCoreProfile.intro}</p>
          ) : null}
          <div className="organization-view-hero__facts">
            <span>
              <MapPin size={14} />
              {orgCoreProfile.location || '未知'}
            </span>
            {orgCoreProfile.supportsLabs ? (
              <span>
                <Users size={14} />
                实验室：{orgCoreProfile.teamCount} 个
              </span>
            ) : (
              <span>
                <Users size={14} />
                关联人员：{orgCoreProfile.memberCount} 人
              </span>
            )}
            <span>
              <Building2 size={14} />
              {orgCoreProfile.entityCode}
            </span>
          </div>
        </div>
      </div>
      <button type="button" className="organization-view-hero__edit-button">
        <FilePenLine size={16} />
        编辑资料
      </button>
    </>
  )
}

// 03）侧栏（OrganizationSpaceSidebar）
function OrganizationSpaceSidebar({ model }: { model: OrganizationSpaceWidgetModel }) {
  const { shellLoadState, shellErrorMessage, isShellReady, orgExtendedProfile, orgInfoRows } = model

  if (shellLoadState === 'loading') {
    return (
      <div className="profile-space-shell-status">
        <LoadingSpinner size={28} label="正在加载机构信息…" />
      </div>
    )
  }
  if (shellLoadState === 'error') {
    return (
      <ProfileSpaceShellStatus
        loadState="error"
        errorMessage={shellErrorMessage ?? '加载机构空间失败，请稍后重试'}
        loadingLabel=""
      />
    )
  }
  if (!isShellReady || !orgExtendedProfile) return null

  return (
    <>
      <section className="profile-side-card organization-view-side-card">
        <h3>机构公告</h3>
        <p className="organization-view-side-card__notice">
          {orgExtendedProfile.announcement || '暂无公告'}
        </p>
      </section>

      <section className="profile-side-card organization-view-side-card">
        <h3>机构信息</h3>
        <table className="organization-view-info-table">
          <tbody>
            {orgInfoRows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}

// 04）机构空间大部件（OrganizationSpaceWidget）
/**
 * 函数名：OrganizationSpaceWidget
 * 功能：在 ProfileSpaceShell 内组装机构空间页的 Hero、Tabs、主内容（含实验室/人员管理）与侧栏。
 * 实现方法：
 * - 通过 useAuth + isOrganizationAdminRole 判定当前用户是否为机构管理员
 * - 实验室 Tab + 管理状态 → 注入 features/team-management/ManageLabsForm
 * - 人员 Tab + 管理状态 → 注入 features/team-management/OrgMembersManageForm
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
export function OrganizationSpaceWidget() {
  const model = useOrganizationSpaceWidget()
  const { userProfile } = useAuth()
  const {
    entityCode, organizationTabs, activeTab, contentGridClassName, shouldRenderSidebar, isSidebarCollapsed,
    orgCoreProfile, isLabsTabActive, isMembersTabActive, handleTabClick, isShellReady, renderMainContent,
  } = model

  const heroVisual = orgCoreProfile?.bannerUrl != null ? (
    <img
      className="organization-view-hero__banner"
      src={orgCoreProfile.bannerUrl}
      alt=""
      aria-hidden="true"
    />
  ) : undefined

  const isEntityAdmin = isOrganizationAdminRole(userProfile?.userRole)
  const [isManagingLabs, setIsManagingLabs] = useState(false)
  const [isManagingMembers, setIsManagingMembers] = useState(false)

  let mainContent: React.ReactNode = null
  if (isLabsTabActive && isManagingLabs && isEntityAdmin) {
    mainContent = (
      <ManageLabsForm
        entityCode={entityCode}
        labs={[]}
        onCancel={() => setIsManagingLabs(false)}
        onSaved={() => setIsManagingLabs(false)}
      />
    )
  } else if (isMembersTabActive && isManagingMembers && isEntityAdmin) {
    mainContent = (
      <OrgMembersManageForm
        entityCode={entityCode}
        members={[]}
        entityType={orgCoreProfile?.type ?? 'ENTERPRISE'}
        onCancel={() => setIsManagingMembers(false)}
        onSaved={() => setIsManagingMembers(false)}
      />
    )
  } else if (isShellReady) {
    mainContent = renderMainContent()
  }

  return (
    <ProfileSpaceShell
      heroAriaLabel="机构空间顶部信息"
      mainAriaLabel="机构空间主体内容"
      sidebarAriaLabel="机构信息侧边栏"
      heroVisual={heroVisual}
      heroContent={<OrganizationSpaceHero model={model} />}
      tabs={
        <ProfileSpaceTabs
          tabs={organizationTabs}
          activeTab={activeTab}
          onTabClick={(tab) => handleTabClick(tab as typeof organizationTabs[number])}
          ariaLabel="机构空间标签"
        />
      }
      mainContent={mainContent}
      sidebar={<OrganizationSpaceSidebar model={model} />}
      contentGridClassName={contentGridClassName}
      shouldRenderSidebar={shouldRenderSidebar}
      isSidebarCollapsed={isSidebarCollapsed}
    />
  )
}
