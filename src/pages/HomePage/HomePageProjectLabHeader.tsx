import { ChevronDown, Info, SlidersHorizontal } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import {
  buildHomeLabFilterTabs,
  HOME_LAB_SORT_OPTIONS,
  HOME_LAB_TECH_DIRECTION_OPTIONS,
  type HomeLabFilterTabId,
} from './homePageLabFilters'

// 01）项目实验室顶栏属性（HomePageProjectLabHeaderProps）
interface HomePageProjectLabHeaderProps {
  projectTotal: number
}

// 02）项目实验室顶栏（HomePageProjectLabHeader）
/**
 * 函数名：HomePageProjectLabHeader
 * 功能：渲染项目实验室标题区与筛选工具栏，工具栏在滚动时固定在顶部导航下方。
 * 实现方法：
 * - 标题区与工具栏作为面板内并列兄弟节点，避免 sticky 被短容器截断
 * - 渲染 Tab 筛选（全部项目 / 看热门 / 看同地 / 看同校）
 * - 渲染技术方向与排序下拉（当前为 UI 占位，后续可接筛选逻辑）
 * 输入：
 * - projectTotal：项目总数，用于「全部项目」Tab 计数
 * 输出：
 * - 返回值：JSX.Element
 * - 副作用：本地维护 Tab 与下拉选中状态
 */
function HomePageProjectLabHeader({ projectTotal }: HomePageProjectLabHeaderProps) {
  const filterTabs = useMemo(() => buildHomeLabFilterTabs(projectTotal), [projectTotal])
  const [activeTabId, setActiveTabId] = useState<HomeLabFilterTabId>('all')
  const [techDirection, setTechDirection] = useState<string>(HOME_LAB_TECH_DIRECTION_OPTIONS[0])
  const [sortOption, setSortOption] = useState<string>(HOME_LAB_SORT_OPTIONS[0])

  return (
    <>
      <div className="home-page__lab-heading">
        <div className="home-page__lab-title-row">
          <h2 className="home-page__lab-title">项目实验室</h2>
          <button type="button" className="home-page__lab-info" aria-label="项目实验室说明">
            <Info size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="home-page__lab-subtitle">探索前沿技术项目，参与真实场景实践，提升工程实战能力</p>
      </div>

      <div className="home-page__lab-toolbar">
        <div className="home-page__lab-tabs" role="tablist" aria-label="项目实验室筛选">
          {filterTabs.map((tab) => {
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
              {HOME_LAB_TECH_DIRECTION_OPTIONS.map((option) => (
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
              {HOME_LAB_SORT_OPTIONS.map((option) => (
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

export default memo(HomePageProjectLabHeader)
