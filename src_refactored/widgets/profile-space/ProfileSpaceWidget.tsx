// 01）个人/团队/机构空间统一大部件入口（ProfileSpaceWidget）
import { Link } from 'react-router-dom'
import { Building2, CalendarClock, CheckCircle2, FilePenLine, Info, Mail, MapPin, Plus, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '@shared/hooks/useAuth'
import LevelBadge from '@shared/ui/LevelBadge'
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import VerifiedOrgModal from '@shared/ui/VerifiedOrgModal'
import { CreateTeamModal } from '@features/team-management'
import {
  buildTeamSpacePath,
} from '@features/profile-space/lib/routing/teamTabRouting'
import {
  type ProfileSpaceVariant,
} from '@features/profile-space/lib/profileSpaceVariant'
import {
  usePersonalSpaceWidget, type PersonalSpaceUiState,
} from './model/usePersonalSpaceWidget'
import {
  useProfileSpaceWidget, usePersonalSpaceVariantData,
  useTeamSpaceVariantData, useOrganizationSpaceVariantData,
  type PersonalSpaceVariantModel, type TeamSpaceVariantModel,
  type OrganizationSpaceVariantModel,
} from './model/useProfileSpaceWidget'
import { ProfileSpaceShell } from './components/ProfileSpaceShell'
import { ProfileSpaceTabs } from './components/ProfileSpaceTabs'
import { ProfileSpaceShellStatus } from './components/ProfileSpaceStatus'
import { PersonalMainContent, TeamMainContent, OrganizationMainContent } from './ProfileSpaceMainContent'
import './ProfileSpaceWidget.css'

// 02）空间页大部件 Props
interface ProfileSpaceWidgetProps {
  variant?: ProfileSpaceVariant
}

// 03）个人空间 Hero
function PersonalHero({ model }: { model: PersonalSpaceVariantModel }) {
  const { shellLoadState, shellErrorMessage, isShellReady, userCoreProfile, userExtendedProfile, heroAvatarUrl } = model

  if (shellLoadState === 'loading') return <ProfileSpaceShellStatus loadState="loading" loadingLabel="正在加载个人空间…" />
  if (shellLoadState === 'error') return <ProfileSpaceShellStatus loadState="error" errorMessage={shellErrorMessage ?? '加载个人空间失败，请稍后重试'} loadingLabel="" />
  if (!isShellReady || !userCoreProfile || !userExtendedProfile) return null

  return (
    <>
      <div className="personal-view-hero">
        <img className="personal-view-hero__avatar" aria-hidden="true" src={heroAvatarUrl} alt={`${userCoreProfile.nickname}头像`} />
        <div className="personal-view-hero__meta">
          <div className="personal-view-hero__name-row">
            <h1>{userCoreProfile.nickname}</h1>
            {userCoreProfile.isVerified ? <span className="personal-view-hero__verified-icon" aria-label="已实名"><CheckCircle2 size={16} strokeWidth={2.2} /></span> : null}
          </div>
          {userCoreProfile.organizationName ? <VerifiedOrgModal organization={userCoreProfile.organizationName} /> : null}
          <p className="personal-view-hero__bio">{userCoreProfile.bio || '该用户很神秘，什么都没有留下…'}</p>
          <div className="personal-view-hero__facts">
            <span><CalendarClock size={14} />加入时间：{userExtendedProfile.joinDate || '未知'}</span>
            <span><MapPin size={14} />IP 属地：{userExtendedProfile.ipLocation || '未知'}</span>
          </div>
        </div>
      </div>
      <button type="button" className="personal-view-hero__edit-button"><FilePenLine size={16} />编辑资料</button>
    </>
  )
}

// 04）个人空间侧栏
function PersonalSidebar({ model, uiState }: { model: PersonalSpaceVariantModel; uiState: PersonalSpaceUiState }) {
  const { userProfile, isLoggedIn } = useAuth()
  const { shellLoadState, shellErrorMessage, isShellReady, userCoreProfile, userExtendedProfile, associatedTeams, activityHeatmap, honors, profileUidFromQuery } = model
  const { isCreateTeamModalOpen, openCreateTeamModal, closeCreateTeamModal } = uiState

  const currentUserId = userProfile?.uid ?? ''
  const viewedUserId = userCoreProfile?.uid ?? profileUidFromQuery ?? ''
  const isOwnProfile = !profileUidFromQuery || (currentUserId && currentUserId === viewedUserId)
  const ownRole = userProfile?.userRole?.toUpperCase() ?? ''
  const canCreateTeam = isOwnProfile && isLoggedIn && userCoreProfile?.isVerified === true && (ownRole === 'STUDENT' || ownRole === 'MENTOR')

  if (shellLoadState === 'loading') return <div className="profile-space-shell-status"><LoadingSpinner size={28} label="正在加载侧栏信息…" /></div>
  if (shellLoadState === 'error') return <ProfileSpaceShellStatus loadState="error" errorMessage={shellErrorMessage ?? '加载个人空间失败，请稍后重试'} loadingLabel="" />
  if (!isShellReady || !userCoreProfile || !userExtendedProfile) return null

  const hasAssociatedTeams = associatedTeams.length > 0

  return (
    <>
      <section className="profile-side-card personal-view-side-card">
        <h3>个人信息</h3>
        <p className="personal-view-side-card__notice">{userExtendedProfile.notice}</p>
        <dl className="personal-view-info-list">
          <div><dt>用户 UID</dt><dd>{userCoreProfile.uid || '未知'}</dd></div>
          {userCoreProfile.level ? <div><dt>能力等级</dt><dd><LevelBadge level={userCoreProfile.level} className="personal-view-level-badge" variant="pill" /></dd></div> : null}
          <div><dt>实名状态</dt><dd><span className="personal-view-verify-badge"><ShieldCheck size={13} />{userCoreProfile.isVerified ? '已实名' : '未实名'}</span></dd></div>
          <div><dt>所属主体</dt><dd>{userCoreProfile.organizationName ?? '未知'}</dd></div>
          <div><dt>职位</dt><dd>{userCoreProfile.position || '未知'}</dd></div>
          {userExtendedProfile.careerData.length > 0 ? <div><dt>专业信息</dt><dd className="personal-view-skill-tags">{userExtendedProfile.careerData.map((c) => <span key={c}>{c}</span>)}</dd></div> : null}
          <div><dt>专业技能</dt><dd className="personal-view-skill-tags">{userExtendedProfile.skills.map((s) => <span key={s}>{s}</span>)}</dd></div>
        </dl>
      </section>

      <section className={`profile-side-card personal-view-side-card ${!hasAssociatedTeams ? 'personal-view-side-card--empty' : ''}`}>
        <div className="personal-view-team-header"><h3>所属团队</h3>
          {canCreateTeam ? <button type="button" className="personal-view-create-team-btn" onClick={openCreateTeamModal} aria-label="创建团队"><Plus size={16} strokeWidth={2.5} /></button> : null}
        </div>
        {hasAssociatedTeams ? (
          <div className="personal-view-team-list">
            {associatedTeams.map((team) => (
              <div key={team.teamUid} className="personal-view-team-card">
                <div><strong><Users size={15} />{team.name}</strong><p>{team.description}</p></div>
                <Link to={buildTeamSpacePath(team.teamUid)} className="personal-view-team-card__enter-link">进入团队</Link>
              </div>
            ))}
          </div>
        ) : <div><p>当前用户还未加入任何团队</p></div>}
      </section>

      <CreateTeamModal open={isCreateTeamModalOpen} onClose={closeCreateTeamModal} />

      <section className={`profile-side-card personal-view-side-card ${honors.length === 0 ? 'personal-view-side-card--empty' : ''}`}>
        <h3>个人荣誉</h3>
        {honors.length === 0 ? <div><Info size={18} /><p>暂无荣誉内容</p></div> : <ul className="personal-view-honor-list">{honors.map((honor, index) => <li key={`honor-${index}`}>{String(honor)}</li>)}</ul>}
      </section>

      <section className={`profile-side-card personal-view-side-card ${activityHeatmap.length === 0 ? 'personal-view-side-card--empty' : ''}`}>
        <h3>活跃度日历</h3>
        {activityHeatmap.length === 0 ? <div><Info size={18} /><p>未查询到活跃度信息</p></div> : <div className="personal-view-heatmap">{activityHeatmap.map((value, index) => <span key={`heat-${index}`} data-level={value} />)}</div>}
      </section>
    </>
  )
}

// 05）团队空间 Hero
function TeamHero({ model }: { model: TeamSpaceVariantModel }) {
  const { shellLoadState, shellErrorMessage, isShellReady, teamCoreProfile, teamExtendedProfile, heroLogoUrl } = model

  if (shellLoadState === 'loading') return <ProfileSpaceShellStatus loadState="loading" loadingLabel="正在加载团队空间…" />
  if (shellLoadState === 'error') return <ProfileSpaceShellStatus loadState="error" errorMessage={shellErrorMessage ?? '加载团队空间失败，请稍后重试'} loadingLabel="" />
  if (!isShellReady || !teamCoreProfile || !teamExtendedProfile) return null

  return (
    <>
      <div className="team-view-hero">
        <img className="team-view-hero__logo" aria-hidden="true" src={heroLogoUrl} alt={`${teamCoreProfile.name} Logo`} />
        <div className="team-view-hero__meta">
          <div className="team-view-hero__name-row"><h1>{teamCoreProfile.name}</h1></div>
          {teamCoreProfile.organizationName ? <VerifiedOrgModal organization={teamCoreProfile.organizationName} /> : null}
          <p className="team-view-hero__description">{teamCoreProfile.description}</p>
          <div className="team-view-hero__facts">
            <span><CalendarClock size={14} />加入时间：{teamCoreProfile.foundedAt || '未知'}</span>
            <span><Users size={14} />成员规模：{teamCoreProfile.memberCount} 人</span>
            <span><MapPin size={14} />研究方向：{teamExtendedProfile.researchDirection || '未知'}</span>
          </div>
        </div>
      </div>
      <button type="button" className="team-view-hero__edit-button"><FilePenLine size={16} />编辑资料</button>
    </>
  )
}

// 06）团队空间侧栏
function TeamSidebar({ model }: { model: TeamSpaceVariantModel }) {
  const { shellLoadState, shellErrorMessage, isShellReady, teamExtendedProfile, teamInfoRows } = model
  if (shellLoadState === 'loading') return <div className="profile-space-shell-status"><LoadingSpinner size={28} label="正在加载团队信息…" /></div>
  if (shellLoadState === 'error') return <ProfileSpaceShellStatus loadState="error" errorMessage={shellErrorMessage ?? '加载团队空间失败，请稍后重试'} loadingLabel="" />
  if (!isShellReady || !teamExtendedProfile) return null

  return (
    <>
      <section className="profile-side-card team-view-side-card">
        <h3>团队公告</h3>
        <p className="team-view-side-card__notice">{teamExtendedProfile.notice}</p>
        {teamExtendedProfile.contactEmail ? <p className="team-view-side-card__contact"><Mail size={14} />{teamExtendedProfile.contactEmail}</p> : null}
      </section>
      <section className="profile-side-card team-view-side-card">
        <h3>团队信息</h3>
        <table className="team-view-info-table"><tbody>{teamInfoRows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td></tr>)}</tbody></table>
      </section>
    </>
  )
}

// 07）机构空间 Hero
function OrganizationHero({ model }: { model: OrganizationSpaceVariantModel }) {
  const { shellLoadState, shellErrorMessage, isShellReady, orgCoreProfile, heroLogoUrl } = model
  if (shellLoadState === 'loading') return <ProfileSpaceShellStatus loadState="loading" loadingLabel="正在加载机构空间…" />
  if (shellLoadState === 'error') return <ProfileSpaceShellStatus loadState="error" errorMessage={shellErrorMessage ?? '加载机构空间失败，请稍后重试'} loadingLabel="" />
  if (!isShellReady || !orgCoreProfile) return null

  return (
    <>
      <div className="organization-view-hero">
        <img className="organization-view-hero__logo" aria-hidden="true" src={heroLogoUrl} alt={`${orgCoreProfile.name} Logo`} />
        <div className="organization-view-hero__meta">
          <div className="organization-view-hero__name-row"><h1>{orgCoreProfile.name}</h1><span className="organization-view-hero__type-badge">{orgCoreProfile.typeLabel}</span></div>
          {orgCoreProfile.intro ? <p className="organization-view-hero__description">{orgCoreProfile.intro}</p> : null}
          <div className="organization-view-hero__facts">
            <span><MapPin size={14} />{orgCoreProfile.location || '未知'}</span>
            {orgCoreProfile.supportsLabs ? <span><Users size={14} />实验室：{orgCoreProfile.teamCount} 个</span> : <span><Users size={14} />关联人员：{orgCoreProfile.memberCount} 人</span>}
            <span><Building2 size={14} />{orgCoreProfile.entityCode}</span>
          </div>
        </div>
      </div>
      <button type="button" className="organization-view-hero__edit-button"><FilePenLine size={16} />编辑资料</button>
    </>
  )
}

// 08）机构空间侧栏
function OrganizationSidebar({ model }: { model: OrganizationSpaceVariantModel }) {
  const { shellLoadState, shellErrorMessage, isShellReady, orgExtendedProfile, orgInfoRows } = model
  if (shellLoadState === 'loading') return <div className="profile-space-shell-status"><LoadingSpinner size={28} label="正在加载机构信息…" /></div>
  if (shellLoadState === 'error') return <ProfileSpaceShellStatus loadState="error" errorMessage={shellErrorMessage ?? '加载机构空间失败，请稍后重试'} loadingLabel="" />
  if (!isShellReady || !orgExtendedProfile) return null

  return (
    <>
      <section className="profile-side-card organization-view-side-card"><h3>机构公告</h3><p className="organization-view-side-card__notice">{orgExtendedProfile.announcement || '暂无公告'}</p></section>
      <section className="profile-side-card organization-view-side-card"><h3>机构信息</h3>
        <table className="organization-view-info-table"><tbody>{orgInfoRows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td></tr>)}</tbody></table>
      </section>
    </>
  )
}

// 09）个人空间 Widget
function PersonalSpaceWidget() {
  const model = usePersonalSpaceVariantData()
  const uiState = usePersonalSpaceWidget()
  const { profileTabs, activeTab, contentGridClassName, shouldRenderSidebar, isSidebarCollapsed, isShellReady, isHomeLikeTabActive, handleTabClick } = model

  return (
    <ProfileSpaceShell
      heroAriaLabel="个人空间顶部信息" mainAriaLabel="个人空间主体内容" sidebarAriaLabel="个人信息侧边栏"
      heroContent={<PersonalHero model={model} />}
      tabs={<ProfileSpaceTabs tabs={profileTabs} activeTab={activeTab} onTabClick={(tab) => handleTabClick(tab as typeof profileTabs[number])} ariaLabel="个人空间标签" />}
      mainContent={isHomeLikeTabActive && !isShellReady ? null : (isShellReady ? <PersonalMainContent model={model} /> : null)}
      sidebar={<PersonalSidebar model={model} uiState={uiState} />}
      contentGridClassName={contentGridClassName} shouldRenderSidebar={shouldRenderSidebar} isSidebarCollapsed={isSidebarCollapsed}
    />
  )
}

// 10）团队空间 Widget
function TeamSpaceWidget() {
  const model = useTeamSpaceVariantData()
  const { teamTabs, activeTab, contentGridClassName, shouldRenderSidebar, isSidebarCollapsed, isShellReady, handleTabClick } = model

  return (
    <ProfileSpaceShell
      heroAriaLabel="团队空间顶部信息" mainAriaLabel="团队空间主体内容" sidebarAriaLabel="团队信息侧边栏"
      heroContent={<TeamHero model={model} />}
      tabs={<ProfileSpaceTabs tabs={teamTabs} activeTab={activeTab} onTabClick={(tab) => handleTabClick(tab as typeof teamTabs[number])} ariaLabel="团队空间标签" />}
      mainContent={isShellReady ? <TeamMainContent model={model} /> : null}
      sidebar={<TeamSidebar model={model} />}
      contentGridClassName={contentGridClassName} shouldRenderSidebar={shouldRenderSidebar} isSidebarCollapsed={isSidebarCollapsed}
    />
  )
}

// 11）机构空间 Widget
function OrganizationSpaceWidget() {
  const model = useOrganizationSpaceVariantData()
  const { organizationTabs, activeTab, contentGridClassName, shouldRenderSidebar, isSidebarCollapsed, orgCoreProfile, handleTabClick, isShellReady } = model

  const heroVisual = orgCoreProfile?.bannerUrl != null ? <img className="organization-view-hero__banner" src={orgCoreProfile.bannerUrl} alt="" aria-hidden="true" /> : undefined

  return (
    <ProfileSpaceShell
      heroAriaLabel="机构空间顶部信息" mainAriaLabel="机构空间主体内容" sidebarAriaLabel="机构信息侧边栏"
      heroVisual={heroVisual} heroContent={<OrganizationHero model={model} />}
      tabs={<ProfileSpaceTabs tabs={organizationTabs} activeTab={activeTab} onTabClick={(tab) => handleTabClick(tab as typeof organizationTabs[number])} ariaLabel="机构空间标签" />}
      mainContent={isShellReady ? <OrganizationMainContent model={model} /> : null}
      sidebar={<OrganizationSidebar model={model} />}
      contentGridClassName={contentGridClassName} shouldRenderSidebar={shouldRenderSidebar} isSidebarCollapsed={isSidebarCollapsed}
    />
  )
}

// 12）统一入口
export function ProfileSpaceWidget({ variant }: ProfileSpaceWidgetProps) {
  const model = useProfileSpaceWidget({ variant })
  if (model.variant === 'team') return <TeamSpaceWidget />
  if (model.variant === 'organization') return <OrganizationSpaceWidget />
  return <PersonalSpaceWidget />
}

export default ProfileSpaceWidget
export { ProfileSpaceShell } from './components/ProfileSpaceShell'
export { ProfileSpaceTabs } from './components/ProfileSpaceTabs'
export { ProfileSpaceShellStatus } from './components/ProfileSpaceStatus'
export { PersonalSpaceWidget, TeamSpaceWidget, OrganizationSpaceWidget }
export { useProfileSpaceWidget } from './model/useProfileSpaceWidget'
export { resolveProfileSpaceVariant, type ProfileSpaceVariant, type ProfileSpaceShellLoadState } from '@features/profile-space/lib/profileSpaceVariant'
export { buildPersonalSpacePath, type PersonalProfileTab } from '@features/profile-space/lib/routing/personalTabRouting'
export { buildTeamSpacePath, buildTeamMembersManagePath, isTeamSpacePathname, type TeamProfileTab } from '@features/profile-space/lib/routing/teamTabRouting'
export { buildOrganizationSpacePath, isOrganizationSpacePathname, type OrganizationProfileTab } from '@features/profile-space/lib/routing/organizationTabRouting'
