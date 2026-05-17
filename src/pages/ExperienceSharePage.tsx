import { useEffect, useMemo, useRef, useState } from 'react'
import { Settings2 } from 'lucide-react'
import GridNoteCard from '../components/common/GridNoteCard'
import RowNoteCard from '../components/common/RowNoteCard'
import TopNavbar from '../components/layout/TopNavbar'
import type { ProfileNoteItem } from '../components/profile/types'
import '../styles/HomePage.css'
import '../styles/ExperienceSharePage.css'

// 01）顶部导航数据（navItems）
const navItems: string[] = ['首页', '企业实战', '高校招募', '经验分享']

// 02）经验分享标签数据（experienceTags）
const experienceTags: string[] = ['微电子', '计算机', '平面设计', '人工智能', '前端开发', '后端开发', '产品设计', '数字媒体']

// 03）经验分享笔记数据（experienceNotes）
const experienceNotes: ProfileNoteItem[] = [
  {
    title: 'CMOS 模拟电路版图避坑指南',
    summary: '总结版图绘制中常见问题与参数权衡，帮助微电子方向同学快速提升实战效率。',
    contentType: '图文',
    tags: ['微电子', '版图设计', '模拟电路'],
    publishTime: '2026-05-02 14:20',
    updateTime: '2026-05-02',
    views: 684,
    comments: 46,
    favorites: 75,
    cover: 'https://images.unsplash.com/photo-1580894742597-87bc8789db3d?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '操作系统课程项目：线程调度可视化',
    summary: '从设计思路到实现细节复盘调度算法实验，附带性能对比与调试经验。',
    contentType: '图文',
    tags: ['计算机', '操作系统', '课程项目'],
    publishTime: '2026-04-26 20:05',
    updateTime: '2026-04-27',
    views: 921,
    comments: 63,
    favorites: 102,
    cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '品牌海报设计中的网格系统实战',
    summary: '介绍平面设计中常用的排版网格方案，结合案例说明如何提升视觉统一性。',
    contentType: '图文',
    tags: ['平面设计', '海报', '视觉规范'],
    publishTime: '2026-04-21 09:40',
    updateTime: '2026-04-22',
    views: 552,
    comments: 28,
    favorites: 66,
    cover: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '从 0 到 1 搭建可复用前端组件库',
    summary: '覆盖组件抽象、文档规范、发布流程与版本管理，帮助团队建立稳定 UI 基建。',
    contentType: '图文',
    tags: ['计算机', '前端开发', '工程化'],
    publishTime: '2026-04-18 17:18',
    updateTime: '2026-04-19',
    views: 837,
    comments: 51,
    favorites: 97,
    cover: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '产品需求拆解方法：从场景到 PRD',
    summary: '分享一套高效的需求拆解流程，帮助校招同学快速进入产品协作节奏。',
    contentType: '图文',
    tags: ['产品设计', '需求分析', '协作流程'],
    publishTime: '2026-04-12 11:32',
    updateTime: '2026-04-13',
    views: 473,
    comments: 19,
    favorites: 58,
    cover: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: '短视频封面与标题联动设计策略',
    summary: '通过视觉层级和文案节奏设计，提高内容点击率与平台推荐效率。',
    contentType: '视频',
    tags: ['数字媒体', '视频', '内容增长'],
    publishTime: '2026-04-09 15:55',
    updateTime: '2026-04-09',
    views: 698,
    comments: 34,
    favorites: 72,
    cover: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=600&q=80',
  },
]

// 04）笔记卡片布局模式类型定义（ExperienceNoteLayoutMode）
type ExperienceNoteLayoutMode = 'grid' | 'row'

// 05）笔记布局缓存键名（EXPERIENCE_NOTE_LAYOUT_STORAGE_KEY）
const EXPERIENCE_NOTE_LAYOUT_STORAGE_KEY = 'unibridge.experience.notes.layoutMode'

// 06）初始笔记布局解析函数（resolveInitialExperienceNoteLayoutMode）
/**
 * 函数名：resolveInitialExperienceNoteLayoutMode
 * 功能：读取经验分享笔记布局缓存值，未命中时默认使用网格布局。
 * 实现方法：
 * - 从 localStorage 读取 EXPERIENCE_NOTE_LAYOUT_STORAGE_KEY
 * - 仅接收 grid/row 两种值，非法值回退到 grid
 * - 使用 try/catch 防止存储不可用导致页面异常
 * 输入：
 * - 无
 * 输出：
 * - 返回值：ExperienceNoteLayoutMode，初始化布局模式
 * - 副作用：读取浏览器 localStorage
 */
function resolveInitialExperienceNoteLayoutMode(): ExperienceNoteLayoutMode {
  try {
    const cachedLayoutMode = window.localStorage.getItem(EXPERIENCE_NOTE_LAYOUT_STORAGE_KEY)
    if (cachedLayoutMode === 'grid' || cachedLayoutMode === 'row') {
      return cachedLayoutMode
    }
  } catch (_error) {
    // 存储不可用时使用默认值，避免影响页面可用性
  }

  return 'grid'
}

// 07）经验分享页面组件（ExperienceSharePage）
/**
 * 函数名：ExperienceSharePage
 * 功能：渲染“经验分享”频道页面，展示大类标签筛选区与笔记专区内容。
 * 实现方法：
 * - 复用 TopNavbar 渲染全局顶部导航
 * - 上方渲染学科大类标签筛选栏，便于后续接入过滤逻辑
 * - 下方渲染笔记专区，右侧外置设置与“换一换”操作按钮
 * - 点击设置按钮向右弹出纵向设置菜单，提供布局切换与扩展入口
 * - 支持 GridNoteCard / RowNoteCard 双布局并缓存用户偏好
 * 输入：
 * - 无（当前版本使用静态展示数据）
 * 输出：
 * - 返回值：JSX.Element，经验分享页面结构
 * - 副作用：无
 */
function ExperienceSharePage() {
  const [isSettingPanelOpen, setIsSettingPanelOpen] = useState<boolean>(false)
  const [layoutMode, setLayoutMode] = useState<ExperienceNoteLayoutMode>(resolveInitialExperienceNoteLayoutMode)
  const settingPanelRef = useRef<HTMLDivElement | null>(null)

  // 08）设置面板外部点击关闭副作用（useEffect）
  useEffect(() => {
    if (!isSettingPanelOpen) {
      return
    }

    const handleDocumentPointerDown = (event: MouseEvent): void => {
      if (settingPanelRef.current && !settingPanelRef.current.contains(event.target as Node)) {
        setIsSettingPanelOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentPointerDown)

    return () => {
      document.removeEventListener('mousedown', handleDocumentPointerDown)
    }
  }, [isSettingPanelOpen])

  // 09）布局模式文本计算（layoutModeText）
  const layoutModeText = useMemo<string>(() => {
    return layoutMode === 'grid' ? '网格' : '行卡片'
  }, [layoutMode])

  // 10）设置按钮点击处理函数（handleSettingButtonClick）
  const handleSettingButtonClick = (): void => {
    setIsSettingPanelOpen((previousState) => !previousState)
  }

  // 11）卡片布局切换处理函数（handleLayoutToggle）
  /**
   * 函数名：handleLayoutToggle
   * 功能：切换经验分享笔记卡片布局并写入缓存。
   * 实现方法：
   * - 根据当前模式在 grid 与 row 之间互切
   * - 更新组件状态触发列表重渲染
   * - 将最新模式写入 localStorage 保持偏好
   * 输入：
   * - 无
   * 输出：
   * - 返回值：void
   * - 副作用：更新状态并写入 localStorage
   */
  const handleLayoutToggle = (): void => {
    const nextMode: ExperienceNoteLayoutMode = layoutMode === 'grid' ? 'row' : 'grid'
    setLayoutMode(nextMode)

    try {
      window.localStorage.setItem(EXPERIENCE_NOTE_LAYOUT_STORAGE_KEY, nextMode)
    } catch (_error) {
      // 存储不可用时静默降级，不阻断交互
    }
  }

  // 12）推荐偏好跳转处理函数（handlePreferenceJump）
  const handlePreferenceJump = (): void => {
    // 预留：后续接入推荐偏好页面跳转
  }

  // 13）黑名单入口点击处理函数（handleBlacklistClick）
  const handleBlacklistClick = (): void => {
    // 预留：后续接入黑名单管理能力
  }

  const isGridLayout: boolean = layoutMode === 'grid'
  const renderedGridNoteCards = useMemo(() => {
    return experienceNotes.map((note) => <GridNoteCard key={note.title} note={note} />)
  }, [])

  const renderedRowNoteCards = useMemo(() => {
    return experienceNotes.map((note) => <RowNoteCard key={note.title} note={note} />)
  }, [])

  return (
    <div className="experience-share-page">
      <TopNavbar navItems={navItems} />

      <main className="experience-share-main">
        <section className="experience-tag-panel" aria-label="经验分享大类筛选">
          <div className="experience-tag-list">
            {experienceTags.map((tag) => (
              <button key={tag} type="button" className="experience-tag-chip">
                {tag}
              </button>
            ))}
          </div>
        </section>

        <section className="experience-note-section" aria-label="经验分享笔记专区">
          <div className="experience-note-panel">
            {isGridLayout ? (
              <div className="experience-note-grid">
                {renderedGridNoteCards}
              </div>
            ) : (
              <div className="experience-note-row-list">
                {renderedRowNoteCards}
              </div>
            )}
          </div>

          <div ref={settingPanelRef} className="experience-note-actions">
            <button
              type="button"
              className={`experience-note-setting ${isSettingPanelOpen ? 'active' : ''}`}
              aria-label="笔记推流设置"
              title="笔记推流设置"
              onClick={handleSettingButtonClick}
            >
              <Settings2 size={16} />
            </button>

            <button type="button" className="experience-note-refresh-button" aria-label="换一换推荐笔记">
              换一换
            </button>

            <div className={`experience-setting-panel ${isSettingPanelOpen ? 'is-open' : ''}`} role="menu" aria-label="经验分享设置">
              <button type="button" className="experience-setting-item" onClick={handleLayoutToggle}>
                卡片布局：{layoutModeText}
              </button>
              <button type="button" className="experience-setting-item" onClick={handlePreferenceJump}>
                推荐偏好
              </button>
              <button type="button" className="experience-setting-item" onClick={handleBlacklistClick}>
                黑名单
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ExperienceSharePage
