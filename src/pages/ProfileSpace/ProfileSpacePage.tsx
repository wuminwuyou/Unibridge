import {
  CalendarClock,
  CheckCircle2,
  FilePenLine,
  Info,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getUserProfileSpace, UserProfileApiError } from '../../api/userProfile'
import LevelBadge from '../../components/common/LevelBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import VerifiedOrgModal from '../../components/common/VerifiedOrgModal'
import TopNavbar from '../../components/layout/TopNavbar/index'
import { buildAvatarFallbackUrl, mapUserProfileSpaceData } from './mapUserProfileSpaceData'
import ProfileHomeTabContent from './components/ProfileHomeTabContent'
import ProfileNotesTabContent from './components/ProfileNotesTabContent'
import ProfileProjectsTabContent from './components/ProfileProjectsTabContent'
import type { UserCoreProfile, UserExtendedProfile, UserLaboratoryProfile } from './types'
import '../../styles/HomePage.css'
import '../../styles/ProfileSpacePage.css'

// 01）顶部导航数据（navItems）
const navItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 02）个人空间 Tab 数据（profileTabs）
const profileTabs: string[] = ['主页', '项目', '笔记', '收藏', '设置']

// 03）个人空间 Tab 类型定义（ProfileTab）
type ProfileTab = (typeof profileTabs)[number]

// 04）支持的路由 Tab 映射（supportedProfileTabs）
const supportedProfileTabs: ReadonlySet<ProfileTab> = new Set<ProfileTab>(profileTabs)

// 05）右侧栏折叠动画时长常量（SIDEBAR_COLLAPSE_DURATION_MS）
const SIDEBAR_COLLAPSE_DURATION_MS = 280

// 06）个人空间页壳加载状态类型（ProfileSpaceShellLoadState）
type ProfileSpaceShellLoadState = 'loading' | 'error' | 'ready'

// 08）路由参数解析函数（resolveTabFromSearch）
/**
 * 函数名：resolveTabFromSearch
 * 功能：从 URL 查询参数中解析个人空间 Tab，支持从外部入口直达具体页面。
 * 实现方法：
 * - 使用 URLSearchParams 读取 tab 参数
 * - 判断 tab 是否属于受支持的 Tab 列表
 * - 不合法时回退到默认“主页”
 * 输入：
 * - search：location.search 查询字符串
 * 输出：
 * - 返回值：ProfileTab，当前应激活的 Tab
 * - 副作用：无
 */
function resolveTabFromSearch(search: string): ProfileTab {
  const searchParams = new URLSearchParams(search)
  const tab = searchParams.get('tab')

  if (tab && supportedProfileTabs.has(tab as ProfileTab)) {
    return tab as ProfileTab
  }

  return '主页'
}

// 11）个人空间页面组件（ProfileSpacePage）
/**
 * 函数名：ProfileSpacePage
 * 功能：渲染个人空间主页面，展示 Hero、项目/笔记内容与右侧信息侧栏。
 * 实现方法：
 * - 复用 TopNavbar 作为页面统一顶部导航
 * - 使用 Hero 区承载头像、昵称、认证信息与简介
 * - 复用 ProjectCard 渲染项目内容区，降低重复实现成本
 * - 渲染笔记列表与右侧信息卡片（个人信息、团队、荣誉、活跃度）
 * 输入：
 * - 无（页壳由 /user-profile/space 加载；各 Tab 组件自行请求 §03~§05 接口）
 * 输出：
 * - 返回值：JSX.Element，个人空间页面结构
 * - 副作用：无
 */
function ProfileSpacePage() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => resolveTabFromSearch(location.search))
  const [shellLoadState, setShellLoadState] = useState<ProfileSpaceShellLoadState>('loading')
  const [shellErrorMessage, setShellErrorMessage] = useState<string | null>(null)
  const [userCoreProfile, setUserCoreProfile] = useState<UserCoreProfile | null>(null)
  const [userExtendedProfile, setUserExtendedProfile] = useState<UserExtendedProfile | null>(null)
  const [userLaboratoryProfile, setUserLaboratoryProfile] = useState<UserLaboratoryProfile | null>(null)
  const [activityHeatmap, setActivityHeatmap] = useState<number[]>([])
  const [honors, setHonors] = useState<unknown[]>([])
  const isProjectTabActive: boolean = activeTab === '项目'
  const isNotesTabActive: boolean = activeTab === '笔记'
  const isSidebarCollapsed: boolean = isProjectTabActive || isNotesTabActive
  const [shouldRenderSidebar, setShouldRenderSidebar] = useState<boolean>(!isSidebarCollapsed)

  // 12）主体容器样式类名计算（contentGridClassName）
  const contentGridClassName = useMemo<string>(() => {
    if (!shouldRenderSidebar) {
      return 'profile-content-grid profile-content-grid--single'
    }

    if (isSidebarCollapsed) {
      return 'profile-content-grid profile-content-grid--collapsing'
    }

    return 'profile-content-grid'
  }, [isSidebarCollapsed, shouldRenderSidebar])

  // 13）路由参数同步副作用（useEffect）
  useEffect(() => {
    const routeTab = resolveTabFromSearch(location.search)
    setActiveTab(routeTab)
  }, [location.search])

  // 14）右侧栏延迟卸载副作用（useEffect）
  useEffect(() => {
    if (!isSidebarCollapsed) {
      setShouldRenderSidebar(true)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShouldRenderSidebar(false)
    }, SIDEBAR_COLLAPSE_DURATION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isSidebarCollapsed])

  // 15）页面滚动重置副作用（useEffect）
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname, location.search])

  // 16）个人空间页壳数据加载副作用（useEffect）
  useEffect(() => {
    let isCancelled = false

    async function loadProfileSpaceShell(): Promise<void> {
      setShellLoadState('loading')
      setShellErrorMessage(null)

      try {
        const spaceData = await getUserProfileSpace()
        if (isCancelled) {
          return
        }

        const mappedSpaceData = mapUserProfileSpaceData(spaceData)
        setUserCoreProfile(mappedSpaceData.userCoreProfile)
        setUserExtendedProfile(mappedSpaceData.userExtendedProfile)
        setUserLaboratoryProfile(mappedSpaceData.userLaboratoryProfile)
        setActivityHeatmap(mappedSpaceData.activityHeatmap)
        setHonors(mappedSpaceData.honors)
        setShellLoadState('ready')
      } catch (error) {
        if (isCancelled) {
          return
        }

        const errorMessage =
          error instanceof UserProfileApiError
            ? error.message
            : '加载个人空间失败，请稍后重试'
        setShellErrorMessage(errorMessage)
        setShellLoadState('error')
      }
    }

    void loadProfileSpaceShell()

    return () => {
      isCancelled = true
    }
  }, [])

  const isShellReady = shellLoadState === 'ready' && userCoreProfile != null && userExtendedProfile != null && userLaboratoryProfile != null
  const heroAvatarUrl = userCoreProfile
    ? userCoreProfile.avatarUrl ?? buildAvatarFallbackUrl(userCoreProfile.nickname)
    : ''

  // 17）Tab 点击处理函数（handleTabClick）
  /**
   * 函数名：handleTabClick
   * 功能：切换个人空间左侧导航 Tab，并触发对应内容与布局动画状态。
   * 实现方法：
   * - 接收目标 tab 值
   * - 更新 activeTab 触发页面重渲染
   * - 由 activeTab 驱动右侧折叠动画与延迟加载逻辑
   * 输入：
   * - tab：目标导航项
   * 输出：
   * - 返回值：void
   * - 副作用：更新组件状态
   */
  const handleTabClick = (tab: ProfileTab): void => {
    setActiveTab(tab)
  }

  return (
    <div className="profile-space-page">
      <TopNavbar navItems={navItems} />

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
          {isShellReady ? (
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
              {profileTabs.map((tab) => (
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

            {activeTab === '主页' || activeTab === '收藏' || activeTab === '设置' ? (
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
              {isShellReady ? (
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

                  <section className={`profile-side-card ${userLaboratoryProfile.laboratoryId === null ? 'profile-side-card--empty' : ''}`}>
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

                  <section
                    className={`profile-side-card ${honors.length === 0 ? 'profile-side-card--empty' : ''}`}
                  >
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

                  <section className={`profile-side-card ${activityHeatmap.length === 0 ? 'profile-side-card--empty' : ''}`}>
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

export default ProfileSpacePage
