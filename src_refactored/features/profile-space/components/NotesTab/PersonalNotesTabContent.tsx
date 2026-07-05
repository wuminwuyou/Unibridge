// 01）个人笔记 Tab 内容（PersonalNotesTabContent）
import { LayoutGrid, List } from 'lucide-react'
import { useMemo, useState } from 'react'
import LoadingSpinner from '@shared/ui/LoadingSpinner'
import { ProfileTabSection } from '@shared/ui/ProfileTabSection'
import type { UserResourceUid } from '@shared/api/resourceUid'
import { GridNoteCard, RowNoteCard } from '@entities/note'
import type { ProfileNoteItem } from '@entities/note/model/profileNoteItem'
import { useUserProfileNotesTabData } from '@entities/user/model/useUserProfileTabData'
import './PersonalNotesTabContent.css'

// 02）笔记筛选项类型（NoteFilterType）
type NoteFilterType = '全部' | '图文' | '视频'

// 03）笔记筛选项列表（noteFilters）
const noteFilters: NoteFilterType[] = ['全部', '图文', '视频']

// 04）笔记卡片布局模式（NoteCardLayoutMode）
type NoteCardLayoutMode = 'grid' | 'row'

// 05）布局缓存键（NOTE_CARD_LAYOUT_STORAGE_KEY）
const NOTE_CARD_LAYOUT_STORAGE_KEY = 'unibridge.profile.notes.cardLayout'

// 06）解析初始布局模式（resolveInitialNoteCardLayoutMode）
function resolveInitialNoteCardLayoutMode(): NoteCardLayoutMode {
  try {
    const cachedLayoutMode = window.localStorage.getItem(NOTE_CARD_LAYOUT_STORAGE_KEY)
    if (cachedLayoutMode === 'grid' || cachedLayoutMode === 'row') {
      return cachedLayoutMode
    }
  } catch (_error) {
    // 忽略存储不可用
  }
  return 'grid'
}

// 07）个人笔记 Tab 内容 Props（PersonalNotesTabContentProps）
interface PersonalNotesTabContentProps {
  profileUid?: UserResourceUid | null
}

// 08）个人笔记 Tab 内容（PersonalNotesTabContent）
/**
 * 函数名：PersonalNotesTabContent
 * 功能：渲染个人空间「笔记」Tab，含分类筛选与 Grid/Row 布局切换。
 * 实现方法：
 * - 调用 entities/user/model/useUserProfileNotesTabData 拉取数据
 * - 复杂筛选与卡片布局切换属于看板交互（Feature 范畴）
 * 输入：
 * - profileUid：目标用户 uid（查看他人空间时由 ?uid= 传入）
 * 输出：
 * - 返回值：React 节点
 * - 副作用：发起网络请求、读写 localStorage
 */
export function PersonalNotesTabContent({ profileUid }: PersonalNotesTabContentProps = {}) {
  const { loadState, errorMessage, notes, total } = useUserProfileNotesTabData(profileUid)
  const [activeFilter, setActiveFilter] = useState<NoteFilterType>('全部')
  const [layoutMode, setLayoutMode] = useState<NoteCardLayoutMode>(resolveInitialNoteCardLayoutMode)

  const filteredNotes = useMemo<ProfileNoteItem[]>(() => {
    if (activeFilter === '全部') return notes
    return notes.filter((note) => note.contentType === activeFilter)
  }, [activeFilter, notes])

  const handleLayoutModeChange = (mode: NoteCardLayoutMode): void => {
    setLayoutMode(mode)
    try {
      window.localStorage.setItem(NOTE_CARD_LAYOUT_STORAGE_KEY, mode)
    } catch (_error) {
      // 忽略存储不可用
    }
  }

  const isGridMode = layoutMode === 'grid'

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
    <ProfileTabSection
      title="笔记"
      titleSuffix={total != null ? `（${total}）` : undefined}
      headerAction={
        <div className="profile-notes-tab__layout-switch" role="group" aria-label="笔记卡片布局切换">
          <button
            type="button"
            className={`profile-notes-tab__layout-switch-button ${isGridMode ? 'active' : ''}`}
            onClick={() => handleLayoutModeChange('grid')}
            aria-label="网格卡片"
            title="网格卡片"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={`profile-notes-tab__layout-switch-button ${!isGridMode ? 'active' : ''}`}
            onClick={() => handleLayoutModeChange('row')}
            aria-label="行卡片"
            title="行卡片"
          >
            <List size={16} />
          </button>
        </div>
      }
    >
      <div className="profile-notes-tab__content">
        <nav className="profile-notes-tab__filter-nav" aria-label="笔记分类筛选">
          {noteFilters.map((filterItem) => (
            <button
              key={filterItem}
              type="button"
              className={`profile-notes-tab__filter-button ${activeFilter === filterItem ? 'active' : ''}`}
              onClick={() => setActiveFilter(filterItem)}
            >
              {filterItem}
            </button>
          ))}
        </nav>

        {filteredNotes.length === 0 ? (
          <p className="profile-tab-empty">暂无笔记内容</p>
        ) : isGridMode ? (
          <div className="profile-notes-tab__grid grid-note-card-grid--equal-rows">
            {filteredNotes.map((note) => (
              <GridNoteCard key={note.uid ?? note.title} note={note} showAuthor={false} />
            ))}
          </div>
        ) : (
          <div className="profile-notes-tab__row-list">
            {filteredNotes.map((note) => (
              <RowNoteCard key={note.uid ?? note.title} note={note} />
            ))}
          </div>
        )}
      </div>
    </ProfileTabSection>
  )
}
