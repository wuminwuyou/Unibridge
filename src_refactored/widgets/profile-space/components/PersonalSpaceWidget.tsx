// 01）个人空间大部件（PersonalSpaceWidget）— 负责拼装个人空间页骨架
import './PersonalView.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock, CheckCircle2, FilePenLine, Info, MapPin, ShieldCheck, Users, Plus,
} from 'lucide-react'
import LevelBadge from '@shared/ui/LevelBadge'
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import VerifiedOrgModal from '@shared/ui/VerifiedOrgModal'
import { useAuth } from '@shared/hooks/useAuth'
import { CreateTeamModal } from '@features/team-management'
import { ProfileSpaceShell } from './ProfileSpaceShell'
import { ProfileSpaceTabs } from './ProfileSpaceTabs'
import { ProfileSpaceShellStatus } from './ProfileSpaceStatus'
import { usePersonalSpaceWidget, type PersonalSpaceWidgetModel } from '../hooks/usePersonalSpaceWidget'
import { buildTeamSpacePath } from '../lib/teamTabRouting'
import { PersonalSpaceMainContent } from './PersonalSpaceMainContent'

// 02）Hero 内容（PersonalSpaceHero）
function PersonalSpaceHero({ model }: { model: PersonalSpaceWidgetModel }) {
  const { shellLoadState, shellErrorMessage, isShellReady, userCoreProfile, userExtendedProfile, heroAvatarUrl } = model

  if (shellLoadState === 'loading') {
    return <ProfileSpaceShellStatus loadState="loading" loadingLabel="正在加载个人空间…" />
  }
  if (shellLoadState === 'error') {
    return (
      <ProfileSpaceShellStatus
        loadState="error"
        errorMessage={shellErrorMessage ?? '加载个人空间失败，请稍后重试'}
        loadingLabel=""
      />
    )
  }
  if (!isShellReady || !userCoreProfile || !userExtendedProfile) return null

  return (
    <>
      <div className="personal-view-hero">
        <img
          className="personal-view-hero__avatar"
          aria-hidden="true"
          src={heroAvatarUrl}
          alt={`${userCoreProfile.nickname}头像`}
        />
        <div className="personal-view-hero__meta">
          <div className="personal-view-hero__name-row">
            <h1>{userCoreProfile.nickname}</h1>
            {userCoreProfile.isVerified ? (
              <span className="personal-view-hero__verified-icon" aria-label="已实名">
                <CheckCircle2 size={16} strokeWidth={2.2} />
              </span>
            ) : null}
          </div>
          {userCoreProfile.organizationName ? (
            <VerifiedOrgModal organization={userCoreProfile.organizationName} />
          ) : null}
          <p className="personal-view-hero__bio">
            {userCoreProfile.bio || '该用户很神秘，什么都没有留下…'}
          </p>
          <div className="personal-view-hero__facts">
            <span>
              <CalendarClock size={14} />
              加入时间：{userExtendedProfile.joinDate || '未知'}
            </span>
            <span>
              <MapPin size={14} />
              IP 属地：{userExtendedProfile.ipLocation || '未知'}
            </span>
          </div>
        </div>
      </div>
      <button type="button" className="personal-view-hero__edit-button">
        <FilePenLine size={16} />
        编辑资料
      </button>
    </>
  )
}

// 03）侧栏内容（PersonalSpaceSidebar）— 含「创建团队」入口注入
function PersonalSpaceSidebar({ model }: { model: PersonalSpaceWidgetModel }) {
  const { userProfile, isLoggedIn } = useAuth()
  const {
    shellLoadState, shellErrorMessage, isShellReady, userCoreProfile, userExtendedProfile,
    associatedTeams, activityHeatmap, honors, profileUidFromQuery,
  } = model

  const currentUserId = userProfile?.uid ?? ''
  const viewedUserId = userCoreProfile?.uid ?? profileUidFromQuery ?? ''
  const isOwnProfile = !profileUidFromQuery || (currentUserId && currentUserId === viewedUserId)
  const ownRole = userProfile?.userRole?.toUpperCase() ?? ''
  const canCreateTeam =
    isOwnProfile && isLoggedIn && userCoreProfile?.isVerified === true && (ownRole === 'STUDENT' || ownRole === 'MENTOR')

  const [isCreateModalOpen, setCreateModalOpen] = useState(false)

  if (shellLoadState === 'loading') {
    return (
      <div className="profile-space-shell-status">
        <LoadingSpinner size={28} label="正在加载侧栏信息…" />
      </div>
    )
  }
  if (shellLoadState === 'error') {
    return (
      <ProfileSpaceShellStatus
        loadState="error"
        errorMessage={shellErrorMessage ?? '加载个人空间失败，请稍后重试'}
        loadingLabel=""
      />
    )
  }
  if (!isShellReady || !userCoreProfile || !userExtendedProfile) return null

  const hasAssociatedTeams = associatedTeams.length > 0

  return (
    <>
      <section className="profile-side-card personal-view-side-card">
        <h3>个人信息</h3>
        <p className="personal-view-side-card__notice">{userExtendedProfile.notice}</p>
        <dl className="personal-view-info-list">
          <div>
            <dt>用户 UID</dt>
            <dd>{userCoreProfile.uid || '未知'}</dd>
          </div>
          {userCoreProfile.level ? (
            <div>
              <dt>能力等级</dt>
              <dd><LevelBadge level={userCoreProfile.level} className="personal-view-level-badge" variant="pill" /></dd>
            </div>
          ) : null}
          <div>
            <dt>实名状态</dt>
            <dd>
              <span className="personal-view-verify-badge">
                <ShieldCheck size={13} />
                {userCoreProfile.isVerified ? '已实名' : '未实名'}
              </span>
            </dd>
          </div>
          <div><dt>所属主体</dt><dd>{userCoreProfile.organizationName ?? '未知'}</dd></div>
          <div><dt>职位</dt><dd>{userCoreProfile.position || '未知'}</dd></div>
          {userExtendedProfile.careerData.length > 0 ? (
            <div>
              <dt>专业信息</dt>
              <dd className="personal-view-skill-tags">
                {userExtendedProfile.careerData.map((c) => <span key={c}>{c}</span>)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>专业技能</dt>
            <dd className="personal-view-skill-tags">
              {userExtendedProfile.skills.map((s) => <span key={s}>{s}</span>)}
            </dd>
          </div>
        </dl>
      </section>

      <section className={`profile-side-card personal-view-side-card ${!hasAssociatedTeams ? 'personal-view-side-card--empty' : ''}`}>
        <div className="personal-view-team-header">
          <h3>所属团队</h3>
          {canCreateTeam ? (
            <button
              type="button"
              className="personal-view-create-team-btn"
              onClick={() => setCreateModalOpen(true)}
              aria-label="创建团队"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
        {hasAssociatedTeams ? (
          <div className="personal-view-team-list">
            {associatedTeams.map((team) => (
              <div key={team.teamUid} className="personal-view-team-card">
                <div>
                  <strong><Users size={15} />{team.name}</strong>
                  <p>{team.description}</p>
                </div>
                <Link to={buildTeamSpacePath(team.teamUid)} className="personal-view-team-card__enter-link">
                  进入团队
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div><p>当前用户还未加入任何团队</p></div>
        )}
      </section>

      <CreateTeamModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />

      <section className={`profile-side-card personal-view-side-card ${honors.length === 0 ? 'personal-view-side-card--empty' : ''}`}>
        <h3>个人荣誉</h3>
        {honors.length === 0 ? (
          <div><Info size={18} /><p>暂无荣誉内容</p></div>
        ) : (
          <ul className="personal-view-honor-list">
            {honors.map((honor, index) => <li key={`honor-${index}`}>{String(honor)}</li>)}
          </ul>
        )}
      </section>

      <section className={`profile-side-card personal-view-side-card ${activityHeatmap.length === 0 ? 'personal-view-side-card--empty' : ''}`}>
        <h3>活跃度日历</h3>
        {activityHeatmap.length === 0 ? (
          <div><Info size={18} /><p>未查询到活跃度信息</p></div>
        ) : (
          <div className="personal-view-heatmap">
            {activityHeatmap.map((value, index) => <span key={`heat-${index}`} data-level={value} />)}
          </div>
        )}
      </section>
    </>
  )
}

// 04）个人空间大部件（PersonalSpaceWidget）
/**
 * 函数名：PersonalSpaceWidget
 * 功能：在 ProfileSpaceShell 内组装个人空间页的 Hero、Tabs、主内容与侧栏。
 * 实现方法：
 * - 调用 usePersonalSpaceWidget 获取数据/状态
 * - Tabs 切换由 Hook 控制路由跳转
 * - 主内容 Tab 渲染由 PersonalSpaceMainContent 分发（主页/项目/笔记）
 * 输入：无
 * 输出：
 * - 返回值：React 节点
 */
export function PersonalSpaceWidget() {
  const model = usePersonalSpaceWidget()
  const {
    profileTabs, activeTab, contentGridClassName, shouldRenderSidebar, isSidebarCollapsed,
    isShellReady, isHomeLikeTabActive, handleTabClick,
  } = model

  const mainContent = isShellReady ? <PersonalSpaceMainContent model={model} /> : null

  return (
    <ProfileSpaceShell
      heroAriaLabel="个人空间顶部信息"
      mainAriaLabel="个人空间主体内容"
      sidebarAriaLabel="个人信息侧边栏"
      heroContent={<PersonalSpaceHero model={model} />}
      tabs={
        <ProfileSpaceTabs
          tabs={profileTabs}
          activeTab={activeTab}
          onTabClick={(tab) => handleTabClick(tab as typeof profileTabs[number])}
          ariaLabel="个人空间标签"
        />
      }
      mainContent={isHomeLikeTabActive && !isShellReady ? null : mainContent}
      sidebar={<PersonalSpaceSidebar model={model} />}
      contentGridClassName={contentGridClassName}
      shouldRenderSidebar={shouldRenderSidebar}
      isSidebarCollapsed={isSidebarCollapsed}
    />
  )
}
