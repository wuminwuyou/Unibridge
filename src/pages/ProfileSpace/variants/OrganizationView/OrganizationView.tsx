import { Building2, FilePenLine, MapPin, Users } from 'lucide-react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import { ProfileSpaceShell, ProfileSpaceShellStatus, ProfileSpaceTabs } from '../../ProfileSpaceShell'
import { OrganizationViewMainContent } from './OrganizationViewMainContent'
import type { OrganizationViewModel } from './useOrganizationViewPage'
import './OrganizationView.css'

// 01）机构空间视图 Props（OrganizationViewProps）
interface OrganizationViewProps {
  model: OrganizationViewModel
}

// 02）机构 Hero 内容（OrganizationViewHeroContent）
function OrganizationViewHeroContent({ model }: OrganizationViewProps) {
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

  if (!isShellReady || !orgCoreProfile) {
    return null
  }

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

// 03）机构侧栏（OrganizationViewSidebar）
function OrganizationViewSidebar({ model }: OrganizationViewProps) {
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

  if (!isShellReady || !orgExtendedProfile) {
    return null
  }

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

// 04）机构空间视图（OrganizationView）
/**
 * 函数名：OrganizationView
 * 功能：在 ProfileSpaceShell 内注入 Organization 变体的 Hero、Tab、主页与侧栏信息表。
 * 输入：
 * - model：useOrganizationViewPage 返回的状态与处理器
 * 输出：
 * - 返回值：React 节点
 */
export function OrganizationView({ model }: OrganizationViewProps) {
  const {
    organizationTabs: tabList,
    activeTab,
    contentGridClassName,
    shouldRenderSidebar,
    isSidebarCollapsed,
    handleTabClick,
    orgCoreProfile,
  } = model

  const heroVisual =
    orgCoreProfile?.bannerUrl != null ? (
      <img
        className="organization-view-hero__banner"
        src={orgCoreProfile.bannerUrl}
        alt=""
        aria-hidden="true"
      />
    ) : undefined

  return (
    <ProfileSpaceShell
      heroAriaLabel="机构空间顶部信息"
      mainAriaLabel="机构空间主体内容"
      sidebarAriaLabel="机构信息侧边栏"
      heroVisual={heroVisual}
      heroContent={<OrganizationViewHeroContent model={model} />}
      tabs={
        <ProfileSpaceTabs
          tabs={tabList}
          activeTab={activeTab}
          onTabClick={(tab) => handleTabClick(tab as (typeof tabList)[number])}
          ariaLabel="机构空间标签"
        />
      }
      mainContent={<OrganizationViewMainContent model={model} />}
      sidebar={<OrganizationViewSidebar model={model} />}
      contentGridClassName={contentGridClassName}
      shouldRenderSidebar={shouldRenderSidebar}
      isSidebarCollapsed={isSidebarCollapsed}
    />
  )
}
