// 01）项目实验室筛选交互 Feature（feed-filter）
import { ChevronDown, Info, SlidersHorizontal } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { buildProjectLabFilterTabs, PROJECT_LAB_SORT_OPTIONS, PROJECT_LAB_TECH_DIRECTION_OPTIONS, type ProjectLabFilterTab, type ProjectLabFilterTabId } from '../constants/filters'

interface ProjectLabHeaderProps {
  projectTotal: number
  labTitle?: string
  labSubtitle?: string
  filterTabs?: ProjectLabFilterTab[]
  onTabChange?: (tabId: ProjectLabFilterTabId) => void
  onTechDirectionChange?: (value: string) => void
  onSortChange?: (value: string) => void
}

function ProjectLabHeader({ projectTotal, labTitle = '项目实验室', labSubtitle = '探索前沿技术项目，参与真实场景实践，提升工程实战能力', filterTabs, onTabChange, onTechDirectionChange, onSortChange }: ProjectLabHeaderProps) {
  const resolvedFilterTabs = useMemo(() => filterTabs ?? buildProjectLabFilterTabs(projectTotal), [filterTabs, projectTotal])
  const [activeTabId, setActiveTabId] = useState<ProjectLabFilterTabId>('all')
  const [techDirection, setTechDirection] = useState<string>(PROJECT_LAB_TECH_DIRECTION_OPTIONS[0])
  const [sortOption, setSortOption] = useState<string>(PROJECT_LAB_SORT_OPTIONS[0])

  return <>
    <div className="home-page__lab-heading">
      <div className="home-page__lab-title-row">
        <h2 className="home-page__lab-title">{labTitle}</h2>
        <button type="button" className="home-page__lab-info" aria-label={`${labTitle}说明`}><Info size={16} aria-hidden="true" /></button>
      </div>
      <p className="home-page__lab-subtitle">{labSubtitle}</p>
    </div>
    <div className="home-page__lab-toolbar">
      <div className="home-page__lab-tabs" role="tablist">
        {resolvedFilterTabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return <button key={tab.id} type="button" role="tab" aria-selected={isActive} className={`home-page__lab-tab ${isActive ? 'home-page__lab-tab--active' : ''}`} onClick={() => { setActiveTabId(tab.id); onTabChange?.(tab.id) }}>
            <span>{tab.label}</span><span className="home-page__lab-tab-count">{tab.count}</span>
          </button>
        })}
      </div>
      <div className="home-page__lab-selects">
        <label className="home-page__lab-select">
          <span className="home-page__lab-select-label">技术方向</span>
          <select className="home-page__lab-select-control" value={techDirection} onChange={e => { setTechDirection(e.target.value); onTechDirectionChange?.(e.target.value) }}>
            {PROJECT_LAB_TECH_DIRECTION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="home-page__lab-select-icon" size={16} />
        </label>
        <label className="home-page__lab-select">
          <span className="home-page__lab-select-label">排序</span>
          <select className="home-page__lab-select-control" value={sortOption} onChange={e => { setSortOption(e.target.value); onSortChange?.(e.target.value) }}>
            {PROJECT_LAB_SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <SlidersHorizontal className="home-page__lab-select-icon" size={16} />
        </label>
      </div>
    </div>
  </>
}

export default memo(ProjectLabHeader)
