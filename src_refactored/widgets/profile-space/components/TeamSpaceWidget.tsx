// 01）团队空间大部件（TeamSpaceWidget）— 负责拼装团队空间页骨架
import './TeamView.css'
import { CalendarClock, FilePenLine, Mail, MapPin, Users } from 'lucide-react'
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import VerifiedOrgModal from '@shared/ui/VerifiedOrgModal'
import { ProfileSpaceShell } from './ProfileSpaceShell'
import { ProfileSpaceTabs } from './ProfileSpaceTabs'
import { ProfileSpaceShellStatus } from './ProfileSpaceStatus'
import { TeamSpaceMainContent } from './TeamSpaceMainContent'
import { useTeamSpaceWidget, type TeamSpaceWidgetModel } from '../hooks/useTeamSpaceWidget'

// 02）Hero 内容（TeamSpaceHero）
function TeamSpaceHero({ model }: { model: TeamSpaceWidgetModel }) {
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
  if (!isShellReady || !teamCoreProfile || !teamExtendedProfile) return null

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

// 03）侧栏（TeamSpaceSidebar）
function TeamSpaceSidebar({ model }: { model: TeamSpaceWidgetModel }) {
  const { shellLoadState, shellErrorMessage, isShellReady, teamExtendedProfile, teamInfoRows } = model

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
  if (!isShellReady || !teamExtendedProfile) return null

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

// 04）团队空间大部件（TeamSpaceWidget）
/**
 * 函数名：TeamSpaceWidget
 * 功能：在 ProfileSpaceShell 内组装团队空间页的 Hero、Tabs、主内容与侧栏。
 * 实现方法：
 * - Hero / Sidebar 由本组件渲染，Tab 主体内容由 TeamSpaceMainContent 分发
 * - 成员管理表单 ManageMembersForm 由 TeamSpaceMainContent 在权限符合时按 Slot 注入
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
export function TeamSpaceWidget() {
  const model = useTeamSpaceWidget()
  const {
    teamTabs, activeTab, contentGridClassName, shouldRenderSidebar, isSidebarCollapsed,
    isShellReady, handleTabClick,
  } = model

  const mainContent = isShellReady ? <TeamSpaceMainContent model={model} /> : null

  return (
    <ProfileSpaceShell
      heroAriaLabel="团队空间顶部信息"
      mainAriaLabel="团队空间主体内容"
      sidebarAriaLabel="团队信息侧边栏"
      heroContent={<TeamSpaceHero model={model} />}
      tabs={
        <ProfileSpaceTabs
          tabs={teamTabs}
          activeTab={activeTab}
          onTabClick={(tab) => handleTabClick(tab as typeof teamTabs[number])}
          ariaLabel="团队空间标签"
        />
      }
      mainContent={mainContent}
      sidebar={<TeamSpaceSidebar model={model} />}
      contentGridClassName={contentGridClassName}
      shouldRenderSidebar={shouldRenderSidebar}
      isSidebarCollapsed={isSidebarCollapsed}
    />
  )
}
