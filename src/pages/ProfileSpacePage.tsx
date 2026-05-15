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
import LevelBadge from '../components/common/LevelBadge'
import TopNavbar from '../components/layout/TopNavbar'
import ProfileHomeTabContent from '../components/profile/ProfileHomeTabContent'
import ProfileProjectsTabContent from '../components/profile/ProfileProjectsTabContent'
import type { ProjectItem } from '../components/home/types'
import type { ProfileNoteItem } from '../components/profile/types'
import '../styles/HomePage.css'
import '../styles/ProfileSpacePage.css'

// 01）顶部导航数据（navItems）
const navItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 02）个人空间 Tab 数据（profileTabs）
const profileTabs: string[] = ['主页', '项目', '笔记', '收藏', '设置']

// 03）个人空间 Tab 类型定义（ProfileTab）
type ProfileTab = (typeof profileTabs)[number]

// 04）个人项目数据（profileProjects）
const profileProjects: ProjectItem[] = [
  {
    title: '数据可视化大屏设计与开发',
    summary: '基于 Vue3 + ECharts 构建企业级可视化大屏，实现业务指标动态展示与交互分析。',
    tags: [{ label: 'Vue3' }, { label: 'ECharts' }, { label: '可视化' }],
    company: '数智未来科技',
    publisher: '张同学',
    publishTime: '2024-12-18',
    level: 'SR',
    amount: '18,600',
  },
  {
    title: '企业官网重构设计',
    summary: '完成品牌官网重构与视觉升级，提升信息可读性与移动端体验，支持组件化内容管理。',
    tags: [{ label: 'Web设计' }, { label: '前端' }, { label: '响应式' }],
    company: '创新互联',
    publisher: '张同学',
    publishTime: '2024-11-29',
    level: 'R',
    amount: '12,900',
  },
  {
    title: '校园二手交易平台小程序',
    summary: '负责小程序交易流程、IM 会话与订单模块，完成用户侧发布与搜索能力迭代。',
    tags: [{ label: 'UniApp' }, { label: '小程序' }, { label: '交易系统' }],
    company: '校园互联科技',
    publisher: '张同学',
    publishTime: '2024-04-15',
    level: 'N',
    amount: '9,800',
  },
  {
    title: '基于大模型的智能问答系统',
    summary: '集成知识库检索与多轮对话能力，支持角色化问答配置与后台评测。',
    tags: [{ label: 'Python' }, { label: 'NLP' }, { label: '大模型' }],
    company: '智源科技有限公司',
    publisher: '张同学',
    publishTime: '2024-05-20',
    level: 'SSR',
    amount: '22,400',
  },
]

// 05）笔记列表数据（noteItems）
const noteItems: ProfileNoteItem[] = [
  {
    title: '大模型 RAG 系统：从原理到项目落地',
    summary: '本文梳理检索增强生成系统的关键链路，覆盖 embedding、召回与重排实践。',
    tags: ['人工智能', 'RAG', '大模型'],
    publishTime: '2024-05-18',
    updateTime: '2024-05-19',
    views: 532,
    favorites: 28,
    cover: 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Vue3 最佳实践总结',
    summary: '从组合式 API 到工程化规范，沉淀一套适用于团队协作的 Vue3 开发方案。',
    tags: ['Vue3', '前端工程'],
    publishTime: '2024-05-12',
    updateTime: '2024-05-13',
    views: 412,
    favorites: 18,
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: '如何设计一个高质量用户系统',
    summary: '结合权限模型、风控策略与可观测方案，分享用户系统从 0 到 1 的实现经验。',
    tags: ['产品设计', '系统设计', '用户体系'],
    publishTime: '2024-05-06',
    updateTime: '2024-05-09',
    views: 299,
    favorites: 14,
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=200&q=80',
  },
]

// 06）活跃度热力图数据（activityHeatmap）
const activityHeatmap: number[] = [
  0, 1, 0, 2, 0, 1, 0, 1, 2, 1, 3, 2, 1, 0, 2, 3, 4, 2, 3, 1, 0, 1, 2, 3, 4, 3, 2, 1, 1, 2, 4, 3, 2, 1, 0, 1,
  2, 3, 4, 4, 3, 2, 1, 0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 0, 1, 2, 1, 0, 0, 1,
  2, 3, 2, 1, 1, 2, 3, 4, 3, 2, 1, 0,
]

// 07）项目 Tab 延迟加载 Hook（useProjectTabLoading）
/**
 * 函数名：useProjectTabLoading
 * 功能：为“项目”Tab 提供模拟接口延迟加载状态，便于后续替换真实 API 请求。
 * 实现方法：
 * - 当 activeTab 切换到“项目”时进入 loading 状态
 * - 使用 setTimeout 模拟 1000ms 的网络等待时间
 * - 超时后结束 loading 并显示项目列表
 * 输入：
 * - activeTab：当前选中的 Tab
 * 输出：
 * - 返回值：boolean，是否处于项目加载状态
 * - 副作用：创建并清理浏览器定时器
 */
function useProjectTabLoading(activeTab: ProfileTab): boolean {
  const [isProjectTabLoading, setIsProjectTabLoading] = useState<boolean>(false)

  useEffect(() => {
    if (activeTab !== '项目') {
      setIsProjectTabLoading(false)
      return
    }

    setIsProjectTabLoading(true)
    const timeoutId = window.setTimeout(() => {
      setIsProjectTabLoading(false)
    }, 1000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeTab])

  return isProjectTabLoading
}

// 08）个人空间页面组件（ProfileSpacePage）
/**
 * 函数名：ProfileSpacePage
 * 功能：渲染个人空间主页面，展示 Hero、项目/笔记内容与右侧信息侧栏。
 * 实现方法：
 * - 复用 TopNavbar 作为页面统一顶部导航
 * - 使用 Hero 区承载头像、昵称、认证信息与简介
 * - 复用 ProjectCard 渲染项目内容区，降低重复实现成本
 * - 渲染笔记列表与右侧信息卡片（个人信息、团队、荣誉、活跃度）
 * 输入：
 * - 无（当前使用静态展示数据）
 * 输出：
 * - 返回值：JSX.Element，个人空间页面结构
 * - 副作用：无
 */
function ProfileSpacePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('主页')
  const isProjectTabLoading = useProjectTabLoading(activeTab)
  const isProjectTabActive: boolean = activeTab === '项目'

  // 09）主体容器样式类名计算（contentGridClassName）
  const contentGridClassName = useMemo<string>(() => {
    return `profile-content-grid ${isProjectTabActive ? 'profile-content-grid--sidebar-collapsed' : ''}`
  }, [isProjectTabActive])

  // 10）Tab 点击处理函数（handleTabClick）
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
          <div className="profile-user">
            <div className="profile-user__avatar" aria-hidden="true">
              张
            </div>
            <div className="profile-user__meta">
              <div className="profile-user__name-row">
                <h1>张同学</h1>
                <span className="profile-user__verified-icon" aria-label="已实名">
                  <CheckCircle2 size={16} strokeWidth={2.2} />
                </span>
              </div>
              <span className="profile-user__org">深圳技术大学</span>
              <p>热爱技术，喜欢把想法和创意变成价值的产品。</p>
              <div className="profile-user__facts">
                <span>
                  <CalendarClock size={14} />
                  加入时间：2023.08.12
                </span>
                <span>
                  <MapPin size={14} />
                  IP属地：广东·深圳
                </span>
              </div>
            </div>
          </div>
          <button type="button" className="profile-edit-button">
            <FilePenLine size={16} />
            编辑资料
          </button>
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

            {isProjectTabActive ? (
              <ProfileProjectsTabContent isLoading={isProjectTabLoading} projects={profileProjects} />
            ) : (
              <ProfileHomeTabContent projects={profileProjects} notes={noteItems} />
            )}
          </div>

          <aside
            className={`profile-right-column ${isProjectTabActive ? 'profile-right-column--collapsed' : ''}`}
            aria-label="个人信息侧边栏"
            aria-hidden={isProjectTabActive}
          >
            <section className="profile-side-card">
              <h3>个人信息</h3>
              <p className="profile-side-card__notice">持续学习，持续创造，保持对前沿技术探索。</p>
              <dl className="profile-info-list">
                <div>
                  <dt>能力等级</dt>
                  <dd>
                    <LevelBadge level="SR" className="profile-level-badge" variant="pill" />
                  </dd>
                </div>
                <div>
                  <dt>实名状态</dt>
                  <dd>
                    <span className="profile-verify-badge">
                      <ShieldCheck size={13} />
                      已实名
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>所属主体</dt>
                  <dd>深圳技术大学</dd>
                </div>
                <div>
                  <dt>职位</dt>
                  <dd>学生</dd>
                </div>
                <div>
                  <dt>专业技能</dt>
                  <dd className="profile-skill-tags">
                    <span>Vue3</span>
                    <span>React</span>
                    <span>Python</span>
                    <span>AI</span>
                    <span>SpringBoot</span>
                  </dd>
                </div>
              </dl>
            </section>

            <section className="profile-side-card">
              <h3>所属团队</h3>
              <div className="profile-team-card">
                <div>
                  <strong>
                    <Users size={15} />
                    智能计算与应用实验室
                  </strong>
                  <p>以工程项目驱动实践，聚焦智能系统与大数据分析方向。</p>
                </div>
                <button type="button">进入团队</button>
              </div>
            </section>

            <section className="profile-side-card profile-side-card--empty">
              <h3>个人荣誉</h3>
              <div>
                <Info size={18} />
                <p>暂无荣誉内容</p>
              </div>
            </section>

            <section className="profile-side-card">
              <h3>活跃度日历</h3>
              <div className="profile-heatmap">
                {activityHeatmap.map((value, index) => (
                  <span key={`heat-${index}`} data-level={value} />
                ))}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default ProfileSpacePage
