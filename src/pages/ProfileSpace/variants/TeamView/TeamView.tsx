import { CalendarClock, FilePenLine, Mail, MapPin, Users } from 'lucide-react'
import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import VerifiedOrgModal from '../../../../components/common/VerifiedOrgModal'
import { ProfileSpaceShell, ProfileSpaceShellStatus, ProfileSpaceTabs } from '../../ProfileSpaceShell'
import { TeamViewMainContent } from './TeamViewMainContent'
import type { TeamViewModel } from './useTeamViewPage'
import './TeamView.css'

// 01）团队空间视图 Props（TeamViewProps）
interface TeamViewProps {
  model: TeamViewModel
}

// 02）团队 Hero 内容（TeamViewHeroContent）
function TeamViewHeroContent({ model }: TeamViewProps) {
  const { shellLoadState, shellErrorMessage, isShellReady, teamCoreProfile, teamExtendedProfile, heroLogoUrl } = model

  if (shellLoadState === 'loading') {
    return <ProfileSpaceShellStatus loadState="loading" loadingLabel="正在加载团队空间…" />
  }

  if (shellLoadState === 'error') {
    return (
      <ProfileSpaceShellStatus
        loadState="error"
        errorMessage={shellErrorMessage ?? '加载团队空间失败，请稍后重试'}
        loadingLabel=""
      />
    )
  }

  if (!isShellReady || !teamCoreProfile || !teamExtendedProfile) {
    return null
  }

  return (
    <>
      <div className="team-view-hero">
        <img
          className="team-view-hero__logo"
          aria-hidden="true"
          src={heroLogoUrl}
          alt={`${teamCoreProfile.name} Logo`}
        />
        <div className="team-view-hero__meta">
          <div className="team-view-hero__name-row">
            <h1>{teamCoreProfile.name}</h1>
          </div>
          {teamCoreProfile.organizationName ? (
            <VerifiedOrgModal organization={teamCoreProfile.organizationName} />
          ) : null}
          <p className="team-view-hero__description">{teamCoreProfile.description}</p>
          <div className="team-view-hero__facts">
            <span>
              <CalendarClock size={14} />
              加入时间：{teamCoreProfile.foundedAt || '未知'}
            </span>
            <span>
              <Users size={14} />
              成员规模：{teamCoreProfile.memberCount} 人
            </span>
            <span>
              <MapPin size={14} />
              研究方向：{teamExtendedProfile.researchDirection || '未知'}
            </span>
          </div>
        </div>
      </div>
      <button type="button" className="team-view-hero__edit-button">
        <FilePenLine size={16} />
        编辑资料
      </button>
    </>
  )
}

// 03）团队空间视图（TeamView）
function TeamViewSidebar({ model }: TeamViewProps) {
  const {
    shellLoadState,
    shellErrorMessage,
    isShellReady,
    teamExtendedProfile,
    teamInfoRows,
  } = model

  if (shellLoadState === 'loading') {
    return (
      <div className="profile-space-shell-status">
        <LoadingSpinner size={28} label="正在加载团队信息…" />
      </div>
    )
  }

  if (shellLoadState === 'error') {
    return (
      <ProfileSpaceShellStatus
        loadState="error"
        errorMessage={shellErrorMessage ?? '加载团队空间失败，请稍后重试'}
        loadingLabel=""
      />
    )
  }

  if (!isShellReady || !teamExtendedProfile) {
    return null
  }

  return (
    <>
      <section className="profile-side-card team-view-side-card">
        <h3>团队公告</h3>
        <p className="team-view-side-card__notice">{teamExtendedProfile.notice}</p>
        {teamExtendedProfile.contactEmail ? (
          <p className="team-view-side-card__contact">
            <Mail size={14} />
            {teamExtendedProfile.contactEmail}
          </p>
        ) : null}
      </section>

      <section className="profile-side-card team-view-side-card">
        <h3>团队信息</h3>
        <table className="team-view-info-table">
          <tbody>
            {teamInfoRows.map((row) => (
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

// 05）团队空间视图（TeamView）
/**
 * 函数名：TeamView
 * 功能：在 ProfileSpaceShell 内注入 Team 变体的 Hero、Tab、主页成员区与侧栏信息表。
 * 输入：
 * - model：useTeamViewPage 返回的状态与处理器
 * 输出：
 * - 返回值：React 节点
 */
export function TeamView({ model }: TeamViewProps) {
  const {
    teamTabs: tabList,
    activeTab,
    contentGridClassName,
    shouldRenderSidebar,
    isSidebarCollapsed,
    handleTabClick,
  } = model

  return (
    <ProfileSpaceShell
      heroAriaLabel="团队空间顶部信息"
      mainAriaLabel="团队空间主体内容"
      sidebarAriaLabel="团队信息侧边栏"
      heroContent={<TeamViewHeroContent model={model} />}
      tabs={
        <ProfileSpaceTabs
          tabs={tabList}
          activeTab={activeTab}
          onTabClick={(tab) => handleTabClick(tab as (typeof tabList)[number])}
          ariaLabel="团队空间标签"
        />
      }
      mainContent={<TeamViewMainContent model={model} />}
      sidebar={<TeamViewSidebar model={model} />}
      contentGridClassName={contentGridClassName}
      shouldRenderSidebar={shouldRenderSidebar}
      isSidebarCollapsed={isSidebarCollapsed}
    />
  )
}
