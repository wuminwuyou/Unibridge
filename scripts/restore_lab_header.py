# -*- coding: utf-8 -*-
"""Restore HomePageProjectLabHeader.tsx with UTF-8 Chinese text."""
from pathlib import Path

CONTENT = r"""import { ChevronDown, Info, SlidersHorizontal } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import {
  buildHomeLabFilterTabs,
  HOME_LAB_SORT_OPTIONS,
  HOME_LAB_TECH_DIRECTION_OPTIONS,
  type HomeLabFilterTabId,
} from './homePageLabFilters'

// 01\uFF09\u9879\u76EE\u5B9E\u9A8C\u5BA4\u9876\u680F\u5C5E\u6027\uFF08HomePageProjectLabHeaderProps\uFF09
interface HomePageProjectLabHeaderProps {
  projectTotal: number
}

// 02\uFF09\u9879\u76EE\u5B9E\u9A8C\u5BA4\u9876\u680F\uFF08HomePageProjectLabHeader\uFF09
/**
 * \u51FD\u6570\u540D\uFF1AHomePageProjectLabHeader
 * \u529F\u80FD\uFF1A\u6E32\u67D3\u9879\u76EE\u5B9E\u9A8C\u5BA4\u6807\u9898\u533A\u4E0E\u7B5B\u9009\u5DE5\u5177\u680F\uFF0C\u5DE5\u5177\u680F\u5728\u6EDA\u52A8\u65F6\u56FA\u5B9A\u5728\u9876\u90E8\u5BFC\u822A\u4E0B\u65B9\u3002
 * \u5B9E\u73B0\u65B9\u6CD5\uFF1A
 * - \u6807\u9898\u533A\u4E0E\u5DE5\u5177\u680F\u4F5C\u4E3A\u9762\u677F\u5185\u5E76\u5217\u5144\u5F1F\u8282\u70B9\uFF0C\u907F\u514D sticky \u88AB\u77ED\u5BB9\u5668\u622A\u65AD
 * - \u6E32\u67D3 Tab \u7B5B\u9009\uFF08\u5168\u90E8\u9879\u76EE / \u770B\u70ED\u95E8 / \u770B\u540C\u5730 / \u770B\u540C\u6821\uFF09
 * - \u6E32\u67D3\u6280\u672F\u65B9\u5411\u4E0E\u6392\u5E8F\u4E0B\u62C9\uFF08\u5F53\u524D\u4E3A UI \u5360\u4F4D\uFF0C\u540E\u7EED\u53EF\u63A5\u7B5B\u9009\u903B\u8F91\uFF09
 * \u8F93\u5165\uFF1A
 * - projectTotal\uFF1A\u9879\u76EE\u603B\u6570\uFF0C\u7528\u4E8E\u300C\u5168\u90E8\u9879\u76EE\u300DTab \u8BA1\u6570
 * \u8F93\u51FA\uFF1A
 * - \u8FD4\u56DE\u503C\uFF1AJSX.Element
 * - \u526F\u4F5C\u7528\uFF1A\u672C\u5730\u7EF4\u62A4 Tab \u4E0E\u4E0B\u62C9\u9009\u4E2D\u72B6\u6001
 */
function HomePageProjectLabHeader({ projectTotal }: HomePageProjectLabHeaderProps) {
  const filterTabs = useMemo(() => buildHomeLabFilterTabs(projectTotal), [projectTotal])
  const [activeTabId, setActiveTabId] = useState<HomeLabFilterTabId>('all')
  const [techDirection, setTechDirection] = useState<string>(HOME_LAB_TECH_DIRECTION_OPTIONS[0])
  const [sortOption, setSortOption] = useState<string>(HOME_LAB_SORT_OPTIONS[0])

  return (
    <>
      __DIV_OPEN__ className="home-page__lab-heading"__DIV_GT__
        __DIV_OPEN__ className="home-page__lab-title-row"__DIV_GT__
          <h2 className="home-page__lab-title">\u9879\u76EE\u5B9E\u9A8C\u5BA4</h2>
          <button type="button" className="home-page__lab-info" aria-label="\u9879\u76EE\u5B9E\u9A8C\u5BA4\u8BF4\u660E">
            <Info size={16} aria-hidden="true" />
          </button>
        __DIV_CLOSE__
        <p className="home-page__lab-subtitle">\u63A2\u7D22\u524D\u6CBF\u6280\u672F\u9879\u76EE\uFF0C\u53C2\u4E0E\u771F\u5B9E\u573A\u666F\u5B9E\u8DF5\uFF0C\u63D0\u5347\u5DE5\u7A0B\u5B9E\u6218\u80FD\u529B</p>
      __DIV_CLOSE__

      __DIV_OPEN__ className="home-page__lab-toolbar"__DIV_GT__
        __DIV_OPEN__ className="home-page__lab-tabs" role="tablist" aria-label="\u9879\u76EE\u5B9E\u9A8C\u5BA4\u7B5B\u9009"__DIV_GT__
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
        __DIV_CLOSE__

        __DIV_OPEN__ className="home-page__lab-selects"__DIV_GT__
          <label className="home-page__lab-select">
            <span className="home-page__lab-select-label">\u6280\u672F\u65B9\u5411</span>
            <select
              className="home-page__lab-select-control"
              value={techDirection}
              onChange={(event) => setTechDirection(event.target.value)}
              aria-label="\u6280\u672F\u65B9\u5411\u7B5B\u9009"
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
            <span className="home-page__lab-select-label">\u6392\u5E8F</span>
            <select
              className="home-page__lab-select-control"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
              aria-label="\u6392\u5E8F\u65B9\u5F0F"
            >
              {HOME_LAB_SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="home-page__lab-select-icon" size={16} aria-hidden="true" />
          </label>
        __DIV_CLOSE__
      __DIV_CLOSE__
    </>
  )
}

export default memo(HomePageProjectLabHeader)
"""

TARGET = Path(__file__).resolve().parents[1] / "src/pages/HomePage/HomePageProjectLabHeader.tsx"

if __name__ == "__main__":
    text = CONTENT.encode("utf-8").decode("unicode_escape")
    text = (
        text.replace("__DIV_OPEN__", "<motion")
        .replace("__DIV_GT__", ">")
        .replace("__DIV_CLOSE__", "</motion>")
    )
    text = text.replace("<motion", "<div").replace("</motion>", "</div>")
    TARGET.write_text(text, encoding="utf-8", newline="\n")
    print("written to", TARGET)
    assert "项目实验室" in text
