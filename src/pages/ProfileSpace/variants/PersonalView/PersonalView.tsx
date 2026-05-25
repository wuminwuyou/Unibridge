import {
  CalendarClock,
  CheckCircle2,
  FilePenLine,
  Info,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react'
import LevelBadge from '../../../../components/common/LevelBadge'
import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import VerifiedOrgModal from '../../../../components/common/VerifiedOrgModal'
import { ProfileSpaceShell, ProfileSpaceShellStatus, ProfileSpaceTabs } from '../../ProfileSpaceShell'
import ProfileHomeTabContent from '../../components/ProfileHomeTabContent/ProfileHomeTabContent'
import ProfileNotesTabContent from '../../components/ProfileNotesTabContent/ProfileNotesTabContent'
import ProfileProjectsTabContent from '../../components/ProfileProjectsTabContent/ProfileProjectsTabContent'
import type { PersonalViewModel } from './usePersonalViewPage'
import './PersonalView.css'

// 01）个人用户空间视图 Props（PersonalViewProps）
interface PersonalViewProps {
  model: PersonalViewModel
}

// 02）个人用户 Hero 内容（PersonalViewHeroContent）
function PersonalViewHeroContent({ model }: PersonalViewProps) {
  const { shellLoadState, shellErrorMessage, isShellReady, userCoreProfile, userExtendedProfile, heroAvatarUrl } =
    model

  if (shellLoadState === 'loading') {
    return <ProfileSpaceShellStatus loadState="loading" loadingLabel="正在加载个人空间…" />
  }

  if (shellLoadState === 'error') {
    return (
      <ProfileSpaceShellStatus
        loadState="error"
        errorMessage={shellErrorMessage ?? '加载个人空间失败，请稍后重试'}
      />
    )
  }

  if (!isShellReady || !userCoreProfile || !userExtendedProfile) {
    return null
  }

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

// 03）个人用户右侧拓展栏（PersonalViewSidebar）
function PersonalViewSidebar({ model }: PersonalViewProps) {
  const {
    shellLoadState,
    shellErrorMessage,
    isShellReady,
    userCoreProfile,
    userExtendedProfile,
    userLaboratoryProfile,
    activityHeatmap,
    honors,
  } = model

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
      />
    )
  }

  if (!isShellReady || !userCoreProfile || !userExtendedProfile || !userLaboratoryProfile) {
    return null
  }

  return (
    <>
      <section className="profile-side-card personal-view-side-card">
        <h3>个人信息</h3>
        <p className="personal-view-side-card__notice">{userExtendedProfile.notice}</p>
        <dl className="personal-view-info-list">
          <div>
            <dt>用户ID</dt>
            <dd>{userCoreProfile.id > 0 ? userCoreProfile.id : '未知'}</dd>
          </div>
          {userCoreProfile.level ? (
            <div>
              <dt>能力等级</dt>
              <dd>
                <LevelBadge level={userCoreProfile.level} className="personal-view-level-badge" variant="pill" />
              </dd>
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
          <div>
            <dt>所属主体</dt>
            <dd>{userCoreProfile.organizationName ?? '未知'}</dd>
          </div>
          <div>
            <dt>职位</dt>
            <dd>{userCoreProfile.position || '未知'}</dd>
          </div>
          {userExtendedProfile.careerData.length > 0 ? (
            <div>
              <dt>专业信息</dt>
              <dd className="personal-view-skill-tags">
                {userExtendedProfile.careerData.map((careerItem) => (
                  <span key={careerItem}>{careerItem}</span>
                ))}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>专业技能</dt>
            <dd className="personal-view-skill-tags">
              {userExtendedProfile.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </dd>
          </div>
        </dl>
      </section>

      <section
        className={`profile-side-card personal-view-side-card ${userLaboratoryProfile.laboratoryId === null ? 'personal-view-side-card--empty' : ''}`}
      >
        <h3>所属团队</h3>
        {userLaboratoryProfile.laboratoryId != null ? (
          <div className="personal-view-team-card">
            <div>
              <strong>
                <Users size={15} />
                {userLaboratoryProfile.laboratoryName}
              </strong>
              <p>{userLaboratoryProfile.laboratoryDescription}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (userLaboratoryProfile.laboratoryEntryPath) {
                  window.location.href = userLaboratoryProfile.laboratoryEntryPath
                }
              }}
            >
              进入团队
            </button>
          </div>
        ) : (
          <div>
            <p>当前用户还未加入任何团队</p>
          </div>
        )}
      </section>

      <section className={`profile-side-card personal-view-side-card ${honors.length === 0 ? 'personal-view-side-card--empty' : ''}`}>
        <h3>个人荣誉</h3>
        {honors.length === 0 ? (
          <div>
            <Info size={18} />
            <p>暂无荣誉内容</p>
          </div>
        ) : (
          <ul className="personal-view-honor-list">
            {honors.map((honor, index) => (
              <li key={`honor-${index}`}>{String(honor)}</li>
            ))}
          </ul>
        )}
      </section>

      <section
        className={`profile-side-card personal-view-side-card ${activityHeatmap.length === 0 ? 'personal-view-side-card--empty' : ''}`}
      >
        <h3>活跃度日历</h3>
        {activityHeatmap.length === 0 ? (
          <div>
            <Info size={18} />
            <p>未查询到活跃度信息</p>
          </div>
        ) : (
          <div className="personal-view-heatmap">
            {activityHeatmap.map((value, index) => (
              <span key={`heat-${index}`} data-level={value} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

// 04）个人用户空间视图（PersonalView）
/**
 * 函数名：PersonalView
 * 功能：在 ProfileSpaceShell 内注入 Personal 变体的 Hero、Tab 与侧栏内容。
 * 输入：
 * - model：usePersonalViewPage 返回的状态与处理器
 * 输出：
 * - 返回值：React 节点
 */
export function PersonalView({ model }: PersonalViewProps) {
  const {
    profileTabs: tabList,
    activeTab,
    contentGridClassName,
    shouldRenderSidebar,
    isSidebarCollapsed,
    isHomeLikeTabActive,
    handleTabClick,
  } = model

  return (
    <ProfileSpaceShell
      heroAriaLabel="个人空间顶部信息"
      mainAriaLabel="个人空间主体内容"
      sidebarAriaLabel="个人信息侧边栏"
      heroContent={<PersonalViewHeroContent model={model} />}
      tabs={
        <ProfileSpaceTabs
          tabs={tabList}
          activeTab={activeTab}
          onTabClick={(tab) => handleTabClick(tab as (typeof tabList)[number])}
          ariaLabel="个人空间标签"
        />
      }
      mainContent={
        <>
          {isHomeLikeTabActive ? (
            <ProfileHomeTabContent
              onViewAllProjects={() => handleTabClick('项目')}
              onViewAllNotes={() => handleTabClick('笔记')}
            />
          ) : null}
          {activeTab === '项目' ? <ProfileProjectsTabContent /> : null}
          {activeTab === '笔记' ? <ProfileNotesTabContent /> : null}
        </>
      }
      sidebar={<PersonalViewSidebar model={model} />}
      contentGridClassName={contentGridClassName}
      shouldRenderSidebar={shouldRenderSidebar}
      isSidebarCollapsed={isSidebarCollapsed}
    />
  )
}
