import {
  CalendarClock,
  CheckCircle2,
  FilePenLine,
  Info,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react'
import LevelBadge from '../../components/common/LevelBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import VerifiedOrgModal from '../../components/common/VerifiedOrgModal'
import TopNavbar from '../../layout/TopNavbar'
import ProfileHomeTabContent from './components/ProfileHomeTabContent/ProfileHomeTabContent'
import ProfileNotesTabContent from './components/ProfileNotesTabContent/ProfileNotesTabContent'
import ProfileProjectsTabContent from './components/ProfileProjectsTabContent/ProfileProjectsTabContent'
import type { ProfileSpacePageModel } from './useProfileSpacePage'

// 01）个人空间页面视图参数（ProfileSpaceViewProps）
interface ProfileSpaceViewProps {
  model: ProfileSpacePageModel
}

// 02）个人空间页面纯视图（ProfileSpaceView）
/**
 * 函数名：ProfileSpaceView
 * 功能：渲染个人空间 Hero、Tab 内容区与右侧信息侧栏的 DOM 结构。
 * 实现方法：
 * - 顶部 TopNavbar + Hero 用户信息区
 * - 左侧 Tab 导航与对应 Tab 子组件
 * - 右侧个人信息/团队/荣誉/活跃度侧栏
 * 输入：
 * - model：useProfileSpacePage 返回的状态与处理器
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：无（事件由 model 处理器承担）
 */
export function ProfileSpaceView({ model }: ProfileSpaceViewProps) {
  const {
    profileTabs: tabList,
    activeTab,
    shellLoadState,
    shellErrorMessage,
    userCoreProfile,
    userExtendedProfile,
    userLaboratoryProfile,
    activityHeatmap,
    honors,
    isSidebarCollapsed,
    shouldRenderSidebar,
    contentGridClassName,
    isShellReady,
    heroAvatarUrl,
    isHomeLikeTabActive,
    handleTabClick,
  } = model

  return (
    <div className="profile-space-page">
      <TopNavbar />

      <section className="profile-hero" aria-label="个人空间顶部信息">
        <div className="profile-hero__visual" aria-hidden="true" />
        <div className="profile-hero__content">
          {shellLoadState === 'loading' ? (
            <div className="profile-space-shell-status">
              <LoadingSpinner size={32} label="正在加载个人空间…" />
            </div>
          ) : null}
          {shellLoadState === 'error' ? (
            <p className="profile-space-shell-error" role="alert">
              {shellErrorMessage ?? '加载个人空间失败，请稍后重试'}
            </p>
          ) : null}
          {isShellReady && userCoreProfile && userExtendedProfile ? (
            <>
              <div className="profile-user">
                <img
                  className="profile-user__avatar"
                  aria-hidden="true"
                  src={heroAvatarUrl}
                  alt={`${userCoreProfile.nickname}头像`}
                />
                <div className="profile-user__meta">
                  <div className="profile-user__name-row">
                    <h1>{userCoreProfile.nickname}</h1>
                    {userCoreProfile.isVerified ? (
                      <span className="profile-user__verified-icon" aria-label="已实名">
                        <CheckCircle2 size={16} strokeWidth={2.2} />
                      </span>
                    ) : null}
                  </div>
                  {userCoreProfile.organizationName ? (
                    <VerifiedOrgModal organization={userCoreProfile.organizationName} />
                  ) : null}
                  <p className="text-gray-600 italic">
                    {userCoreProfile.bio || '该用户很神秘，什么都没有留下…'}
                  </p>
                  <div className="profile-user__facts">
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
              <button type="button" className="profile-edit-button">
                <FilePenLine size={16} />
                编辑资料
              </button>
            </>
          ) : null}
        </div>
      </section>

      <main className="profile-space-main">
        <section className={contentGridClassName} aria-label="个人空间主体内容">
          <div className="profile-left-column">
            <nav className="profile-tabs" aria-label="个人空间标签">
              {tabList.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`profile-tab ${tab === activeTab ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {isHomeLikeTabActive ? (
              <ProfileHomeTabContent
                onViewAllProjects={() => handleTabClick('项目')}
                onViewAllNotes={() => handleTabClick('笔记')}
              />
            ) : null}
            {activeTab === '项目' ? <ProfileProjectsTabContent /> : null}
            {activeTab === '笔记' ? <ProfileNotesTabContent /> : null}
          </div>

          {shouldRenderSidebar ? (
            <aside
              className={`profile-right-column ${isSidebarCollapsed ? 'profile-right-column--collapsed' : ''}`}
              aria-label="个人信息侧边栏"
              aria-hidden={isSidebarCollapsed}
            >
              {shellLoadState === 'loading' ? (
                <div className="profile-space-shell-status">
                  <LoadingSpinner size={28} label="正在加载侧栏信息…" />
                </div>
              ) : null}
              {shellLoadState === 'error' ? (
                <p className="profile-space-shell-error" role="alert">
                  {shellErrorMessage ?? '加载个人空间失败，请稍后重试'}
                </p>
              ) : null}
              {isShellReady && userCoreProfile && userExtendedProfile && userLaboratoryProfile ? (
                <>
                  <section className="profile-side-card">
                    <h3>个人信息</h3>
                    <p className="profile-side-card__notice">{userExtendedProfile.notice}</p>
                    <dl className="profile-info-list">
                      <div>
                        <dt>用户ID</dt>
                        <dd>{userCoreProfile.id > 0 ? userCoreProfile.id : '未知'}</dd>
                      </div>
                      {userCoreProfile.level ? (
                        <div>
                          <dt>能力等级</dt>
                          <dd>
                            <LevelBadge level={userCoreProfile.level} className="profile-level-badge" variant="pill" />
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt>实名状态</dt>
                        <dd>
                          <span className="profile-verify-badge">
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
                          <dd className="profile-skill-tags">
                            {userExtendedProfile.careerData.map((careerItem) => (
                              <span key={careerItem}>{careerItem}</span>
                            ))}
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt>专业技能</dt>
                        <dd className="profile-skill-tags">
                          {userExtendedProfile.skills.map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section
                    className={`profile-side-card ${userLaboratoryProfile.laboratoryId === null ? 'profile-side-card--empty' : ''}`}
                  >
                    <h3>所属团队</h3>
                    {userLaboratoryProfile.laboratoryId != null ? (
                      <div className="profile-team-card">
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

                  <section className={`profile-side-card ${honors.length === 0 ? 'profile-side-card--empty' : ''}`}>
                    <h3>个人荣誉</h3>
                    {honors.length === 0 ? (
                      <div>
                        <Info size={18} />
                        <p>暂无荣誉内容</p>
                      </div>
                    ) : (
                      <ul className="profile-honor-list">
                        {honors.map((honor, index) => (
                          <li key={`honor-${index}`}>{String(honor)}</li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section
                    className={`profile-side-card ${activityHeatmap.length === 0 ? 'profile-side-card--empty' : ''}`}
                  >
                    <h3>活跃度日历</h3>
                    {activityHeatmap.length === 0 ? (
                      <div>
                        <Info size={18} />
                        <p>未查询到活跃度信息</p>
                      </div>
                    ) : (
                      <div className="profile-heatmap">
                        {activityHeatmap.map((value, index) => (
                          <span key={`heat-${index}`} data-level={value} />
                        ))}
                      </div>
                    )}
                  </section>
                </>
              ) : null}
            </aside>
          ) : null}
        </section>
      </main>
    </div>
  )
}
