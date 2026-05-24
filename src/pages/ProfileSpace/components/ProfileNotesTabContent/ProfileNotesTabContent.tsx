import { LayoutGrid, List } from 'lucide-react'
import { useMemo, useState } from 'react'
import GridNoteCard from '../../../../components/NoteCard/GridNoteCard'
import LoadingSpinner from '../../../../components/common/LoadingSpinner'
import RowNoteCard from '../../../../components/NoteCard/RowNoteCard'
import type { ProfileNoteItem } from '../types'
import { useProfileNotesData } from './useProfileNotesData'
import './ProfileNotesTabContent.css'

// 02）笔记筛选项类型定义（NoteFilterType）
type NoteFilterType = '全部' | '图文' | '视频'

// 03）笔记筛选项列表（noteFilters）
const noteFilters: NoteFilterType[] = ['全部', '图文', '视频']

// 04）笔记卡片布局模式类型定义（NoteCardLayoutMode）
type NoteCardLayoutMode = 'grid' | 'row'

// 05）笔记卡片布局缓存键名（NOTE_CARD_LAYOUT_STORAGE_KEY）
const NOTE_CARD_LAYOUT_STORAGE_KEY = 'unibridge.profile.notes.cardLayout'

// 06）初始布局模式解析函数（resolveInitialNoteCardLayoutMode）
/**
 * 函数名：resolveInitialNoteCardLayoutMode
 * 功能：读取本地缓存并解析笔记卡片布局模式，未命中时默认使用 grid。
 * 实现方法：
 * - 从 localStorage 读取 NOTE_CARD_LAYOUT_STORAGE_KEY
 * - 仅接受 grid/row 两种值，其他情况统一回退 grid
 * - 增加 try/catch 防止浏览器存储不可用导致渲染失败
 * 输入：
 * - 无
 * 输出：
 * - 返回值：NoteCardLayoutMode，初始卡片布局模式
 * - 副作用：读取浏览器 localStorage
 */
function resolveInitialNoteCardLayoutMode(): NoteCardLayoutMode {
  try {
    const cachedLayoutMode = window.localStorage.getItem(NOTE_CARD_LAYOUT_STORAGE_KEY)
    if (cachedLayoutMode === 'grid' || cachedLayoutMode === 'row') {
      return cachedLayoutMode
    }
  } catch (_error) {
    // 忽略存储不可用场景，回退默认值
  }

  return 'grid'
}

// 07）个人空间笔记Tab内容组件（ProfileNotesTabContent）
/**
 * 函数名：ProfileNotesTabContent
 * 功能：渲染个人空间“笔记”Tab 的左筛选+右侧卡片视图内容，并支持 Grid/Row 切换。
 * 实现方法：
 * - 左侧渲染纵向筛选导航（全部/图文/视频）
 * - 使用筛选状态计算当前要展示的笔记列表
 * - 右上角提供 Grid/Row 视图切换，并缓存到 localStorage
 * - 根据当前视图模式分别渲染 GridNoteCard 或 RowNoteCard
 * 输入：无
 * 输出：
 * - 返回值：JSX.Element，笔记 Tab 内容结构
 * - 副作用：发起网络请求
 */
function ProfileNotesTabContent() {
  const { loadState, errorMessage, notes, total } = useProfileNotesData()
  const [activeFilter, setActiveFilter] = useState<NoteFilterType>('全部')
  const [layoutMode, setLayoutMode] = useState<NoteCardLayoutMode>(resolveInitialNoteCardLayoutMode)

  // 08）筛选后的笔记列表计算（filteredNotes）
  const filteredNotes = useMemo<ProfileNoteItem[]>(() => {
    if (activeFilter === '全部') {
      return notes
    }

    return notes.filter((note) => note.contentType === activeFilter)
  }, [activeFilter, notes])

  // 09）视图模式切换处理函数（handleLayoutModeChange）
  /**
   * 函数名：handleLayoutModeChange
   * 功能：切换笔记卡片展示模式，并将选择写入本地缓存。
   * 实现方法：
   * - 更新 layoutMode 触发视图重渲染
   * - 将模式值写入 localStorage，用于下次恢复
   * - 写入异常时静默降级，不影响页面主流程
   * 输入：
   * - mode：目标布局模式（grid 或 row）
   * 输出：
   * - 返回值：void
   * - 副作用：更新组件状态、写入 localStorage
   */
  const handleLayoutModeChange = (mode: NoteCardLayoutMode): void => {
    setLayoutMode(mode)

    try {
      window.localStorage.setItem(NOTE_CARD_LAYOUT_STORAGE_KEY, mode)
    } catch (_error) {
      // 忽略存储不可用场景，保持页面可用
    }
  }

  const isGridMode: boolean = layoutMode === 'grid'
  const renderedGridNoteCards = useMemo(() => {
    return filteredNotes.map((note) => <GridNoteCard key={note.title} note={note} />)
  }, [filteredNotes])

  const renderedRowNoteCards = useMemo(() => {
    return filteredNotes.map((note) => <RowNoteCard key={note.title} note={note} />)
  }, [filteredNotes])

  if (loadState === 'loading') {
    return (
      <div className="profile-tab-status">
        <LoadingSpinner size={32} label="正在加载笔记数据…" />
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <p className="profile-tab-status profile-tab-status--error" role="alert">
        {errorMessage ?? '加载笔记列表失败，请稍后重试'}
      </p>
    )
  }

  return (
    <article className="profile-section-card">
      <header className="profile-section-card__head">
        <h2>笔记{total != null ? `（${total}）` : ''}</h2>
        <div className="profile-note-layout-switch" role="group" aria-label="笔记卡片布局切换">
          <button
            type="button"
            className={`profile-note-layout-switch__button ${isGridMode ? 'active' : ''}`}
            onClick={() => handleLayoutModeChange('grid')}
            aria-label="网格卡片"
            title="网格卡片"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={`profile-note-layout-switch__button ${!isGridMode ? 'active' : ''}`}
            onClick={() => handleLayoutModeChange('row')}
            aria-label="行卡片"
            title="行卡片"
          >
            <List size={16} />
          </button>
        </div>
      </header>
      <div className="profile-notes-content">
        <nav className="profile-note-filter-nav" aria-label="笔记分类筛选">
          {noteFilters.map((filterItem) => (
            <button
              key={filterItem}
              type="button"
              className={`profile-note-filter-button ${activeFilter === filterItem ? 'active' : ''}`}
              onClick={() => setActiveFilter(filterItem)}
            >
              {filterItem}
            </button>
          ))}
        </nav>

        {filteredNotes.length === 0 ? (
          <p className="profile-tab-empty">暂无笔记内容</p>
        ) : isGridMode ? (
          <div className="profile-note-grid profile-note-grid--three-columns grid-note-card-grid--equal-rows">
            {renderedGridNoteCards}
          </div>
        ) : (
          <div className="profile-note-row-list">
            {renderedRowNoteCards}
          </div>
        )}
      </div>
    </article>
  )
}

export default ProfileNotesTabContent
