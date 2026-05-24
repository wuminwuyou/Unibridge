import { ChevronDown, Info, SlidersHorizontal } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import {
  buildProjectLabFilterTabs,
  PROJECT_LAB_SORT_OPTIONS,
  PROJECT_LAB_TECH_DIRECTION_OPTIONS,
  type ProjectLabFilterTab,
  type ProjectLabFilterTabId,
} from '../projectLabFilters'

// 01）项目实验室顶栏属性（ProjectLabHeaderProps）
interface ProjectLabHeaderProps {
  projectTotal: number
  labTitle?: string
  labSubtitle?: string
  /** 自定义筛选 Tab；未传时使用默认四项（含看同校） */
  filterTabs?: ProjectLabFilterTab[]
}

// 02）项目实验室顶栏（ProjectLabHeader）
/**
 * 函数名：ProjectLabHeader
 * 功能：渲染项目实验室标题区与筛选工具栏，工具栏在滚动时固定在顶部导航下方。
 * 实现方法：
 * - 标题区与工具栏作为面板内并列兄弟节点，避免 sticky 被短容器截断
 * - 渲染 Tab 筛选（全部项目 / 看热门 / 看同地 / 看同校，或外部传入自定义 Tab）
 * - 渲染技术方向与排序下拉（当前为 UI 占位，后续可接筛选逻辑）
 * 输入：
 * - projectTotal：项目总数，用于「全部项目」Tab 计数
 * - labTitle：标题文案，默认「项目实验室」
 * - labSubtitle：副标题文案
 * - filterTabs：可选自定义 Tab 列表
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：本地维护 Tab 与下拉选中状态
 */
function ProjectLabHeader({
  projectTotal,
  labTitle = '项目实验室',
  labSubtitle = '探索前沿技术项目，参与真实场景实践，提升工程实战能力',
  filterTabs,
}: ProjectLabHeaderProps) {
  const resolvedFilterTabs = useMemo(
    () => filterTabs ?? buildProjectLabFilterTabs(projectTotal),
    [filterTabs, projectTotal],
  )
  const [activeTabId, setActiveTabId] = useState<ProjectLabFilterTabId>('all')
  const [techDirection, setTechDirection] = useState<string>(PROJECT_LAB_TECH_DIRECTION_OPTIONS[0])
  const [sortOption, setSortOption] = useState<string>(PROJECT_LAB_SORT_OPTIONS[0])

  return (
    <>
      <div className="home-page__lab-heading">
        <div className="home-page__lab-title-row">
          <h2 className="home-page__lab-title">{labTitle}</h2>
          <button type="button" className="home-page__lab-info" aria-label={`${labTitle}说明`}>
            <Info size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="home-page__lab-subtitle">{labSubtitle}</p>
      </div>

      <div className="home-page__lab-toolbar">
        <div className="home-page__lab-tabs" role="tablist" aria-label={`${labTitle}筛选`}>
          {resolvedFilterTabs.map((tab) => {
            const isActive = tab.id === activeTabId

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`home-page__lab-tab ${isActive ? 'home-page__lab-tab--active' : ''}`.trim()}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="home-page__lab-tab-count">{tab.count}</span>
              </button>
            )
          })}
        </div>

        <div className="home-page__lab-selects">
          <label className="home-page__lab-select">
            <span className="home-page__lab-select-label">技术方向</span>
            <select
              className="home-page__lab-select-control"
              value={techDirection}
              onChange={(event) => setTechDirection(event.target.value)}
              aria-label="技术方向筛选"
            >
              {PROJECT_LAB_TECH_DIRECTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="home-page__lab-select-icon" size={16} aria-hidden="true" />
          </label>

          <label className="home-page__lab-select">
            <span className="home-page__lab-select-label">排序</span>
            <select
              className="home-page__lab-select-control"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
              aria-label="排序方式"
            >
              {PROJECT_LAB_SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="home-page__lab-select-icon" size={16} aria-hidden="true" />
          </label>
        </div>
      </div>
    </>
  )
}

export default memo(ProjectLabHeader)
