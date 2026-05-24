import { useEffect, useMemo, useRef, useState } from 'react'
import { Settings2 } from 'lucide-react'
import GridNoteCard from '../../components/NoteCard/GridNoteCard'
import RowNoteCard from '../../components/NoteCard/RowNoteCard'
import TopNavbar from '../../layout/TopNavbar'
import { experienceShareNotes, experienceShareTags } from './experienceSharePageData'
import './style.css'

// 01）笔记卡片布局模式类型（ExperienceNoteLayoutMode）
type ExperienceNoteLayoutMode = 'grid' | 'row'

// 03）笔记布局缓存键名（EXPERIENCE_NOTE_LAYOUT_STORAGE_KEY）
const EXPERIENCE_NOTE_LAYOUT_STORAGE_KEY = 'unibridge.experience.notes.layoutMode'

// 04）读取初始笔记布局（resolveInitialExperienceNoteLayoutMode）
/**
 * 函数名：resolveInitialExperienceNoteLayoutMode
 * 功能：读取经验分享笔记布局缓存值，未命中时默认使用网格布局。
 * 实现方法：
 * - 从 localStorage 读取 EXPERIENCE_NOTE_LAYOUT_STORAGE_KEY
 * - 仅接收 grid/row 两种值，非法值回退到 grid
 * - 使用 try/catch 防止存储不可用导致页面异常
 * 输入：无
 * 输出：
 * - 返回值：ExperienceNoteLayoutMode
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

// 05）经验分享页面组件（ExperienceSharePage）
/**
 * 函数名：ExperienceSharePage
 * 功能：渲染"经验分享"频道页面，展示大类标签筛选区与笔记专区内容。
 * 实现方法：
 * - 复用 TopNavbar 渲染全局顶部导航
 * - 上方渲染学科大类标签筛选栏，便于后续接入过滤逻辑
 * - 下方渲染笔记专区，右侧外置设置与"换一换"操作按钮
 * - 点击设置按钮向右弹出纵向设置菜单，提供布局切换与扩展入口
 * - 支持 GridNoteCard / RowNoteCard 双布局并缓存用户偏好
 * - 静态数据从 src/data/experienceSharePageData 引入
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element，经验分享页面结构
 * - 副作用：无
 */
function ExperienceSharePage() {
    const [isSettingPanelOpen, setIsSettingPanelOpen] = useState<boolean>(false)
    const [layoutMode, setLayoutMode] = useState<ExperienceNoteLayoutMode>(resolveInitialExperienceNoteLayoutMode)
    const settingPanelRef = useRef<HTMLDivElement | null>(null)

    // 06）设置面板外部点击关闭副作用（useEffect）
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

    // 07）布局模式文本计算（layoutModeText）
    const layoutModeText = useMemo<string>(() => {
        return layoutMode === 'grid' ? '网格' : '行卡片'
    }, [layoutMode])

    // 08）设置按钮点击（handleSettingButtonClick）
    const handleSettingButtonClick = (): void => {
        setIsSettingPanelOpen((previousState) => !previousState)
    }

    // 09）卡片布局切换（handleLayoutToggle）
    /**
     * 函数名：handleLayoutToggle
     * 功能：切换经验分享笔记卡片布局并写入缓存。
     * 实现方法：
     * - 根据当前模式在 grid 与 row 之间互切
     * - 更新组件状态触发列表重渲染
     * - 将最新模式写入 localStorage 保持偏好
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

    // 10）推荐偏好跳转占位（handlePreferenceJump）
    const handlePreferenceJump = (): void => {
        // 预留：后续接入推荐偏好页面跳转
    }

    // 11）黑名单入口占位（handleBlacklistClick）
    const handleBlacklistClick = (): void => {
        // 预留：后续接入黑名单管理能力
    }

    const isGridLayout: boolean = layoutMode === 'grid'

    // 12）笔记卡片渲染缓存（grid / row）
    const renderedGridNoteCards = useMemo(() => {
        return experienceShareNotes.map((note) => <GridNoteCard key={note.title} note={note} />)
    }, [])

    const renderedRowNoteCards = useMemo(() => {
        return experienceShareNotes.map((note) => <RowNoteCard key={note.title} note={note} />)
    }, [])

    return (
        <div className="experience-share-page">
            <TopNavbar />

            <main className="experience-share-main">
                <section className="experience-tag-panel" aria-label="经验分享大类筛选">
                    <div className="experience-tag-list">
                        {experienceShareTags.map((tag) => (
                            <button key={tag} type="button" className="experience-tag-chip">
                                {tag}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="experience-note-section" aria-label="经验分享笔记专区">
                    <div className="experience-note-panel">
                        {isGridLayout ? (
                            <div className="experience-note-grid grid-note-card-grid--equal-rows">{renderedGridNoteCards}</div>
                        ) : (
                            <div className="experience-note-row-list">{renderedRowNoteCards}</div>
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

                        <div
                            className={`experience-setting-panel ${isSettingPanelOpen ? 'is-open' : ''}`}
                            role="menu"
                            aria-label="经验分享设置"
                        >
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
